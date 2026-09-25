"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Crown, Lightbulb, RotateCcw, SkipForward, Star, Timer, TriangleAlert, X } from "lucide-react";
import { BadgeIcon } from "@/components/BadgeIcon";
import { Confetti } from "@/components/Confetti";
import { MatchQuestion } from "@/components/MatchQuestion";
import { OrderQuestion } from "@/components/OrderQuestion";
import { WritingStep } from "@/components/writing/WritingStep";
import { ProgressBar } from "@/components/ui";
import { messageOf, postJson } from "@/lib/client";
import { formatClock, formatNumber, formatSeconds, optionLetter, pluralize } from "@/lib/format";
import { playSound, primeSound } from "@/lib/sound";
import { assemble } from "@/lib/writing";
import type { AnswerResult, FinishResult, PracticeQuestion, StartAttemptResponse } from "@/lib/types";

type Phase = "loading" | "failed" | "answering" | "feedback" | "result";

/**
 * De onde vem a prática. A lição e o simulado compartilham todo o fluxo de
 * responder: mudam só onde a tentativa começa e para onde se volta.
 */
export type PracticeSource =
  | { kind: "lesson"; lessonId: number; lessonTitle: string }
  | { kind: "exam"; subjectId: number; subjectSlug: string; subjectName: string };

function startUrl(source: PracticeSource): string {
  return source.kind === "lesson"
    ? `/api/lessons/${source.lessonId}/attempts`
    : `/api/subjects/${source.subjectId}/exams`;
}

function backHref(source: PracticeSource): string {
  return source.kind === "lesson" ? `/licao/${source.lessonId}` : `/materia/${source.subjectSlug}`;
}

function sourceTitle(source: PracticeSource): string {
  return source.kind === "lesson" ? source.lessonTitle : `Simulado · ${source.subjectName}`;
}

/**
 * A espera antes da primeira questão.
 *
 * Era uma frase solta no meio do branco. É o instante de maior desistência da
 * prática — a pessoa acabou de decidir estudar e a tela parece quebrada. O
 * esqueleto mostra a forma do que está vindo: cabeçalho, barra de progresso,
 * enunciado e alternativas, no mesmo lugar em que vão aparecer. Quando as
 * questões chegam, nada salta.
 *
 * O texto continua existindo para quem usa leitor de tela, que não enxerga
 * forma nenhuma.
 */
function PracticeSkeleton({ source }: { source: PracticeSource }) {
  // Larguras diferentes: blocos de tamanho igual parecem grade, não texto.
  const linhas = ["w-full", "w-4/5"];
  const alternativas = ["w-3/5", "w-2/5", "w-4/5", "w-1/2", "w-3/5"];

  return (
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-40 pt-4" aria-busy="true">
      <p className="sr-only" role="status">
        Preparando as questões…
      </p>

      <header className="flex items-center justify-between gap-3" aria-hidden="true">
        <Link href={backHref(source)} aria-label="Sair da prática" className="grid size-11 place-items-center rounded-full text-ink/70 hover:bg-ink/5">
          <X className="size-6" aria-hidden="true" />
        </Link>
        <p className="truncate text-sm text-ink/60">{sourceTitle(source)}</p>
        <div className="flex min-w-[5.5rem] items-center justify-end gap-1.5 font-mono text-base font-medium text-ink/40">
          <Timer className="size-5" aria-hidden="true" /> 00:00
        </div>
      </header>

      <div className="motion-safe:animate-pulse" aria-hidden="true">
        <div className="mt-3 flex gap-1.5">
          {alternativas.map((_, i) => (
            <span key={i} className="h-1.5 flex-1 rounded-full bg-ink/15" />
          ))}
        </div>

        <div className="mt-8 space-y-3">
          <div className="h-4 w-2/5 rounded-pill bg-ink/10" />
          {linhas.map((largura) => (
            <div key={largura} className={`h-7 ${largura} rounded-pill bg-ink/10`} />
          ))}
        </div>

        <ul className="mt-6 space-y-3">
          {alternativas.map((largura, i) => (
            <li key={i} className="flex min-h-14 items-center gap-3 rounded-control border-2 border-ink/10 px-4">
              <span className="size-6 shrink-0 rounded-full bg-ink/10" />
              <span className={`h-4 ${largura} rounded-pill bg-ink/10`} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function PracticeClient({ source }: { source: PracticeSource }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<{ id: number; total: number } | null>(null);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  /** A sequência montada numa questão de ordenar: índices do que está na tela. */
  const [ordering, setOrdering] = useState<number[]>([]);
  /** Na questão de associar: para cada item da esquerda, a resposta escolhida. */
  const [matching, setMatching] = useState<(number | null)[]>([]);
  const [feedback, setFeedback] = useState<AnswerResult | null>(null);
  const [result, setResult] = useState<FinishResult | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  /** Os textos entregues em cada parte. A etapa que junta o texto começa por eles. */
  const [entregues, setEntregues] = useState<Record<number, string>>({});

  const questionStart = useRef(0);
  const started = useRef(false);
  const feedbackRef = useRef<HTMLDivElement>(null);

  async function begin() {
    setError(null);
    try {
      const data = await postJson<StartAttemptResponse>(startUrl(source));
      setAttempt(data.attempt);
      setQuestions(data.questions);
      setIndex(0);
      setSelected(null);
      setOrdering([]);
      setMatching([]);
      setFeedback(null);
      setResult(null);
      setEntregues({});
      setElapsed(0);
      questionStart.current = Date.now();
      setPhase("answering");
    } catch (e) {
      setError(messageOf(e));
      setPhase("failed");
    }
  }

  useEffect(() => {
    // Trava contra o duplo disparo do React em desenvolvimento: uma tentativa por visita.
    if (started.current) return;
    started.current = true;
    void begin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cronômetro crescente: mostra o tempo gasto na questão atual.
  useEffect(() => {
    if (phase !== "answering") return;
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - questionStart.current) / 1000));
    }, 500);
    return () => window.clearInterval(id);
  }, [phase, index]);

  /*
  | A explicação vem até a pessoa, não o contrário.
  |
  | Era `block: "nearest"`, que rola o mínimo possível — e o mínimo deixava a
  | explicação encostada na barra fixa de baixo, com a pegadinha cortada. Quem
  | acabou de responder quer ler o porquê, e estava tendo que rolar para isso.
  | `"center"` põe o bloco no meio da tela, longe das duas bordas.
  */
  useEffect(() => {
    if (phase === "feedback") feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [phase]);

  const question = questions[index];


  /**
   * Manda a resposta. `choice` é a alternativa; `sequencia` é a ordem.
   * Pular é mandar os dois vazios, em qualquer formato.
   */
  async function submit(choice: number | null, sequencia: number[] = []) {
    if (!attempt || !question || busy) return;
    // Acorda o áudio AQUI, ainda dentro do gesto: a resposta só chega depois
    // do await, quando o iPhone já não libera som. Ver lib/sound.ts.
    primeSound();
    const seconds = Math.max(0, Math.round((Date.now() - questionStart.current) / 1000));
    const respondeu = choice !== null || sequencia.length > 0;
    setBusy(true);
    setError(null);
    try {
      const data = await postJson<AnswerResult>(`/api/attempts/${attempt.id}/answers`, {
        question_id: question.id,
        selected: choice,
        ordering: sequencia,
        seconds,
      });
      setSelected(choice);
      setFeedback(data);
      setPhase("feedback");
      // Quem pulou não acertou nem errou: nada a comemorar nem a lamentar.
      if (respondeu) playSound(data.is_correct ? "acerto" : "erro");
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  }

  /** Entrega uma parte do texto, com a autoavaliação. Texto vazio é pular. */
  async function submitWriting(text: string, checklist: boolean[]) {
    if (!attempt || !question || busy) return;
    const seconds = Math.max(0, Math.round((Date.now() - questionStart.current) / 1000));
    setBusy(true);
    setError(null);
    try {
      const data = await postJson<AnswerResult>(`/api/attempts/${attempt.id}/answers`, {
        question_id: question.id,
        text,
        checklist,
        seconds,
      });
      setEntregues((e) => ({ ...e, [question.id]: text }));
      setFeedback(data);
      setPhase("feedback");
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  }

  async function next() {
    if (!attempt || busy) return;
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      setSelected(null);
      setOrdering([]);
      setMatching([]);
      setFeedback(null);
      setElapsed(0);
      questionStart.current = Date.now();
      setPhase("answering");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setResult(await postJson<FinishResult>(`/api/attempts/${attempt.id}/finish`));
      setPhase("result");
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  }

  if (phase === "loading") {
    return <PracticeSkeleton source={source} />;
  }

  if (phase === "failed") {
    return (
      <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-6 text-center">
        <div className="space-y-5">
          <TriangleAlert className="mx-auto size-10 text-coral" aria-hidden="true" />
          <h1 className="text-2xl">Não deu para começar</h1>
          <p role="alert" className="text-base text-ink/70">{error}</p>
          <div className="flex flex-col gap-3">
            <button type="button" className="btn btn-primary" onClick={() => { setPhase("loading"); void begin(); }}>
              Tentar de novo
            </button>
            <Link href={backHref(source)} className="btn btn-ghost">
              {source.kind === "lesson" ? "Voltar para a lição" : "Voltar para a matéria"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <ResultView
        result={result}
        source={source}
        writing={questions.every((q) => q.format === "writing")}
        onRetry={() => { setPhase("loading"); void begin(); }}
      />
    );
  }

  if (!question || !attempt) return null;

  const answeredCount = index + (phase === "feedback" ? 1 : 0);
  const isLast = index + 1 === questions.length;
  const escrita = question.format === "writing" && question.writing ? { ...question, writing: question.writing } : null;
  // Na escrita não são questões: são partes de um texto, ou o texto inteiro no simulado.
  const rotulo = escrita
    ? questions.length === 1
      ? "Texto completo"
      : `Parte ${index + 1} de ${attempt.total}`
    : `Questão ${index + 1} de ${attempt.total}`;

  /*
  | As vagas da questão de associar, uma por item da esquerda.
  |
  | São DERIVADAS da questão, e não guardadas por um efeito: o estado começa
  | vazio a cada questão, e aqui ele ganha o tamanho certo. Sincronizar array
  | com questão num `useEffect` é o caminho curto para a pessoa ver as vagas
  | da questão anterior por um quadro.
  */
  const vagas = question.prompts?.length ?? 0;
  const pares = matching.length === vagas ? matching : new Array<number | null>(vagas).fill(null);
  // Pular é não ter escolhido nada, no formato que for.
  const pulou =
    question.format === "order"
      ? ordering.length === 0
      : question.format === "match"
        ? pares.every((v) => v === null)
        : selected === null;

  return (
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-40 pt-4">
      <header className="flex items-center justify-between gap-3">
        <Link href={backHref(source)} aria-label="Sair da prática" className="grid size-11 place-items-center rounded-full text-ink/70 hover:bg-ink/5">
          <X className="size-6" aria-hidden="true" />
        </Link>
        <p className="truncate text-sm text-ink/60">{sourceTitle(source)}</p>
        <div className="flex min-w-[5.5rem] items-center justify-end gap-1.5 font-mono text-base font-medium" aria-label="Tempo nesta questão" role="timer">
          <Timer className="size-5 text-coral" aria-hidden="true" />
          {formatClock(elapsed)}
        </div>
      </header>

      <div className="mt-3 flex gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={attempt.total} aria-valuenow={answeredCount} aria-label="Progresso da prática">
        {questions.map((q, i) => (
          <span key={q.id} className={`h-1.5 flex-1 rounded-full ${i < answeredCount ? "bg-ink" : i === index ? "bg-sky" : "bg-ink/15"}`} />
        ))}
      </div>

      <section key={question.id} className="anim-rise mt-8">
        <p className="label-mono">
          {rotulo} · {question.topic}
        </p>
        <h1 className="mt-3 text-2xl">{question.statement}</h1>

        {escrita ? (
          <WritingStep
            attemptId={attempt.id}
            question={escrita}
            phase={phase === "feedback" ? "feedback" : "answering"}
            initialText={
              escrita.writing.assemble
                ? assemble(
                    questions
                      .slice(0, index)
                      .filter((q) => q.format === "writing" && !q.writing?.assemble && !q.writing?.draft_only)
                      .map((q) => entregues[q.id] ?? ""),
                  )
                : ""
            }
            busy={busy}
            feedback={feedback}
            onDeliver={(text, checklist) => void submitWriting(text, checklist)}
            onSkip={() => void submitWriting("", [])}
          />
        ) : question.format === "match" ? (
          <MatchQuestion
            prompts={question.prompts ?? []}
            options={question.options}
            matching={pares}
            onChange={setMatching}
            disabled={phase !== "answering" || busy}
            correctPairs={phase === "feedback" ? (feedback?.correct_pairs ?? null) : null}
          />
        ) : question.format === "order" ? (
          <OrderQuestion
            options={question.options}
            ordering={ordering}
            onChange={setOrdering}
            disabled={phase !== "answering" || busy}
            correctOrder={phase === "feedback" ? (feedback?.correct_order ?? null) : null}
          />
        ) : (
          <ul className="mt-6 space-y-3">
            {question.options.map((option, i) => {
              const isSelected = selected === i;
              const showing = phase === "feedback" && feedback;
              const isCorrect = showing && feedback.correct_index === i;
              const isWrongPick = showing && isSelected && !feedback.is_correct;

              let style = "border-ink/15 bg-surface-raised hover:border-ink/40";
              if (phase === "answering" && isSelected) style = "border-sky bg-sky-soft";
              if (isCorrect) style = "border-sage bg-sage-soft";
              if (isWrongPick) style = "border-brick bg-brick-soft";
              if (showing && !isCorrect && !isWrongPick) style = "border-ink/10 bg-surface-raised opacity-60";

              return (
                <li key={i}>
                  <button
                    type="button"
                    disabled={phase !== "answering" || busy}
                    aria-pressed={isSelected}
                    onClick={() => setSelected(i)}
                    className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-base transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${style}`}
                  >
                    <span className={`grid size-8 shrink-0 place-items-center rounded-full font-mono text-sm font-medium ${isCorrect ? "bg-sage text-on-accent" : isWrongPick ? "bg-brick text-white" : "bg-ink/8"}`}>
                      {isCorrect ? <Check className="size-4" aria-hidden="true" /> : isWrongPick ? <X className="size-4" aria-hidden="true" /> : optionLetter(i)}
                    </span>
                    <span>{option}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {error && <p role="alert" className="mt-4 rounded-2xl bg-brick-soft px-4 py-3 text-base text-brick">{error}</p>}

        {phase === "feedback" && feedback && !escrita && (
          <div ref={feedbackRef} className="anim-rise mt-6 space-y-4">
            <div className={`rounded-2xl px-5 py-4 ${feedback.is_correct ? "bg-sage-soft" : pulou ? "bg-paper-2" : "bg-brick-soft"}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-2xl font-bold">
                  {feedback.is_correct
                    ? "Acertou!"
                    : pulou
                      ? "Você pulou esta"
                      : feedback.correct_order
                        ? "A ordem não era essa"
                        : "Não foi dessa vez"}
                </p>
                {feedback.xp ? (
                  <span className="anim-pop inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-raised px-3 py-1 font-mono text-base font-medium">
                    <Star className="size-4 text-coral" aria-hidden="true" /> +{feedback.xp} XP
                  </span>
                ) : null}
              </div>
              {!feedback.is_correct && !feedback.correct_order && !feedback.correct_pairs && feedback.correct_index !== null && (
                <p className="mt-1 text-base">
                  Gabarito: <strong>{optionLetter(feedback.correct_index)}) {question.options[feedback.correct_index]}</strong>
                </p>
              )}
              <p className="mt-3 text-base leading-relaxed">{feedback.explanation}</p>
            </div>
            {feedback.pitfall && (
              <div className="rounded-2xl border-2 border-coral/40 bg-coral-soft px-5 py-4">
                <p className="flex items-center gap-2 font-bold">
                  <Lightbulb className="size-5 text-coral" aria-hidden="true" /> Pegadinha
                </p>
                <p className="mt-1.5 text-base leading-relaxed">{feedback.pitfall}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* A escrita tem a própria barra enquanto se escreve (Conferir, Entregar). */}
      {!(escrita && phase === "answering") && (
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-md gap-3 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {phase === "answering" ? (
            <>
              <button type="button" className="btn btn-ghost border-2 border-ink/15" disabled={busy} onClick={() => submit(null)}>
                <SkipForward className="size-5" aria-hidden="true" /> Pular
              </button>
              {question.format === "match" ? (
                <button
                  type="button"
                  className="btn btn-primary flex-1"
                  disabled={pares.some((v) => v === null) || busy}
                  onClick={() => submit(null, pares.filter((v): v is number => v !== null))}
                >
                  {busy
                    ? "Enviando…"
                    : pares.some((v) => v === null)
                      ? `Faltam ${pares.filter((v) => v === null).length}`
                      : "Confirmar"}
                </button>
              ) : question.format === "order" ? (
                <button
                  type="button"
                  className="btn btn-primary flex-1"
                  disabled={ordering.length !== question.options.length || busy}
                  onClick={() => submit(null, ordering)}
                >
                  {busy
                    ? "Enviando…"
                    : ordering.length === question.options.length
                      ? "Confirmar"
                      : `Faltam ${question.options.length - ordering.length}`}
                </button>
              ) : (
                <button type="button" className="btn btn-primary flex-1" disabled={selected === null || busy} onClick={() => submit(selected)}>
                  {busy ? "Enviando…" : "Confirmar"}
                </button>
              )}
            </>
          ) : (
            <button type="button" className="btn btn-dark flex-1" disabled={busy} onClick={next}>
              {busy ? "Um instante…" : isLast ? "Ver resultado" : escrita ? "Próxima parte" : "Próxima questão"} <ArrowRight className="size-5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

/*
| A tela de resultado.
|
| Duas queixas do Sávio a desenharam, e as duas são a mesma queixa vista de
| ângulos diferentes.
|
| A primeira: os botões de continuar ficavam no fim de uma rolagem. O que a
| pessoa quer aqui é seguir — ela acabou de terminar e o próximo passo estava
| escondido embaixo de tudo. Agora ele mora numa barra fixa, o mesmo lugar em
| que "Confirmar" esteve a tentativa inteira: o dedo não muda de posição entre
| responder a última questão e ir para a próxima lição.
|
| A segunda: a tela tinha "cara de IA". Ela era uma pilha de cartões
| arredondados do mesmo tamanho, cada um com seu ícone, seu rótulo cinza e seu
| número grande — tempo, XP, streak, conquista, todos com o mesmo peso. Pilha
| sem hierarquia é o que denuncia tela gerada, e também é o que obrigava a
| rolar. A correção é uma só: UM número é a notícia (o acerto), o resto vira
| uma faixa de apoio em três colunas, e o que sobra é frase, não cartão.
| Cartão ficou só onde há o que comemorar de verdade — a conquista nova.
*/
export function ResultView({
  result,
  source,
  onRetry,
  writing = false,
}: {
  result: FinishResult;
  source: PracticeSource;
  onRetry: () => void;
  /** Prática de escrita: a conta é de partes cumpridas, não de acertos. */
  writing?: boolean;
}) {
  const isExam = source.kind === "exam";
  const headline = writing
    ? result.percent >= 80
      ? "Texto de pé!"
      : "Texto escrito. Agora é reescrever."
    : result.percent >= 80 ? "Mandou bem!" : result.percent >= 50 ? "Bom caminho." : "Agora você conhece as pegadinhas.";
  const unidade = writing ? (result.total === 1 ? ["texto", "textos"] : ["parte", "partes"]) : ["questão", "questões"];
  const g = result.gamification;
  const celebrate = result.is_record || (g?.new_badges.length ?? 0) > 0;
  const diff = result.is_record && result.previous_best_avg_seconds !== null && result.avg_seconds !== null
    ? result.previous_best_avg_seconds - result.avg_seconds
    : null;

  /*
  | A faixa de apoio. Tudo que não é o acerto cabe aqui, em três colunas de
  | uma linha cada — antes eram três cartões empilhados, e a tela inteira de
  | rolagem saía daí. Some a coluna que não tem dado, em vez de mostrar
  | traço: simulado sem gamificação liberada fica com a faixa mais estreita,
  | não com buracos.
  */
  const resumo: { label: string; value: string }[] = [];
  if (result.avg_seconds !== null) resumo.push({ label: writing ? "Por parte" : "Por questão", value: formatSeconds(result.avg_seconds) });
  if (g) resumo.push({ label: "XP ganho", value: `+${formatNumber(g.xp_earned)}` });
  if (g && g.streak.current > 0) resumo.push({ label: "Sequência", value: pluralize(g.streak.current, "dia", "dias") });

  /*
  | Uma frase, não três. O recorde é a única coisa sobre tempo que vale
  | interromper a leitura; na primeira vez não há recorde, e aí o convite é
  | criar um.
  */
  // Escrever não é corrida: recorde de tempo num texto convidaria a escrever pior.
  const sobreOTempo = result.avg_seconds === null || writing
    ? null
    : diff !== null
      ? `Novo recorde: ${formatSeconds(diff)} mais rápido que antes.`
      : result.previous_best_avg_seconds !== null
        ? `Seu recorde continua em ${formatSeconds(result.previous_best_avg_seconds)} por questão.`
        : "Esse é o tempo para bater na próxima vez.";

  return (
    <div className="relative mx-auto min-h-dvh max-w-md px-5 pb-44 pt-10">
      {celebrate && <Confetti />}

      <p className="label-mono">{isExam ? "Simulado concluído" : "Lição concluída"}</p>
      <h1 className="anim-rise mt-1.5 text-3xl">{headline}</h1>

      <div className="mt-7">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-mono text-5xl font-medium tabular-nums">
            {result.percent}
            <span className="text-2xl">%</span>
          </p>
          <p className="text-base text-content-secondary">
            {result.correct} de {pluralize(result.total, unidade[0], unidade[1])}{writing ? (result.total === 1 ? " cumprido" : " cumpridas") : ""}
          </p>
        </div>
        <ProgressBar
          percent={result.percent}
          label={writing ? `${result.percent}% das partes cumpridas` : `${result.percent}% de acerto`}
          animate
          className="mt-3"
        />
      </div>

      {resumo.length > 0 && (
        <dl className="mt-6 flex divide-x divide-ink/10 rounded-2xl bg-surface-raised shadow-lift">
          {resumo.map((item) => (
            <div key={item.label} className="min-w-0 flex-1 px-4 py-3">
              <dt className="truncate text-sm text-content-subtle">{item.label}</dt>
              <dd className="font-mono text-xl font-medium tabular-nums">{item.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {sobreOTempo && (
        <p className={`mt-3 text-base ${diff !== null ? "font-bold text-sage" : "text-content-secondary"}`}>
          {sobreOTempo}
        </p>
      )}

      {result.weak_topic && (
        <div className="mt-5 text-base">
          <p>
            Ponto para reforçar: <strong>{result.weak_topic}</strong>.
          </p>
          <Link
            href={source.kind === "lesson" ? `/licao/${source.lessonId}` : `/materia/${source.subjectSlug}`}
            className="mt-0.5 inline-block font-bold underline underline-offset-4"
          >
            {isExam ? "Ver as lições da matéria" : "Revisar a lição"}
          </Link>
        </div>
      )}

      {g && g.new_badges.length > 0 && (
        <section aria-labelledby="conquistas" className="mt-7">
          <h2 id="conquistas" className="text-xl">
            {g.new_badges.length === 1 ? "Conquista nova" : "Conquistas novas"}
          </h2>
          <ul className="mt-3 space-y-2">
            {g.new_badges.map((badge, i) => (
              <li
                key={badge.key}
                className="anim-pop flex items-center gap-3 rounded-2xl bg-sage-soft px-4 py-3"
                style={{ animationDelay: `${i * 140}ms` }}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sage">
                  <BadgeIcon badgeKey={badge.key} className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-bold">{badge.name}</span>
                  <span className="block text-sm text-content-secondary">{badge.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.limited_by_plan && (
        <Link href="/planos" className="mt-6 flex items-center gap-3 rounded-2xl border-2 border-dashed border-ink/25 px-5 py-4 hover:border-ink/50">
          <Crown className="size-5 shrink-0 text-sky" aria-hidden="true" />
          <span className="text-base">
            <strong>Você viu só parte das questões desta lição.</strong> Veja como liberar todas com o Plus.
          </span>
        </Link>
      )}

      <div className="mt-8">
        <Link href="/inicio" className="inline-flex items-center gap-2 text-base font-bold text-content-secondary underline underline-offset-4">
          <ArrowLeft className="size-5" aria-hidden="true" /> Voltar ao início
        </Link>
      </div>

      {/*
        A mesma barra da prática, na mesma altura: quem apertou "Confirmar"
        oito vezes aperta "Continuar" sem procurar. O nome da próxima lição
        fica ACIMA do botão, cortado com reticências se for longo — dentro do
        botão ele empurrava o texto para duas linhas e mudava a altura da
        barra conforme o título.
      */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-surface/95 backdrop-blur">
        <div className="mx-auto max-w-md px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {result.next_lesson && (
            <p className="mb-2 truncate text-sm text-content-subtle">A seguir: {result.next_lesson.title}</p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              className={`btn ${result.next_lesson ? "btn-ghost border-2 border-ink/15 px-4" : "btn-primary flex-1"}`}
              onClick={onRetry}
              aria-label={isExam ? "Fazer um novo simulado" : "Praticar esta lição de novo"}
            >
              <RotateCcw className="size-5" aria-hidden="true" />
              {result.next_lesson ? "" : isExam ? "Novo simulado" : "Praticar de novo"}
            </button>
            {result.next_lesson && (
              <Link href={`/licao/${result.next_lesson.id}`} className="btn btn-primary flex-1">
                Continuar <ArrowRight className="size-5" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
