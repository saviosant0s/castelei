"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Crown, Flame, Lightbulb, RotateCcw, SkipForward, Star, Target, Timer, Trophy, TriangleAlert, X } from "lucide-react";
import { BadgeIcon } from "@/components/BadgeIcon";
import { Confetti } from "@/components/Confetti";
import { messageOf, postJson } from "@/lib/client";
import { formatClock, formatNumber, formatSeconds, optionLetter, pluralize, streakMessage } from "@/lib/format";
import type { AnswerResult, FinishResult, PracticeQuestion, StartAttemptResponse } from "@/lib/types";

type Phase = "loading" | "failed" | "answering" | "feedback" | "result";

export function PracticeClient({ lessonId, lessonTitle }: { lessonId: number; lessonTitle: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<{ id: number; total: number } | null>(null);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<AnswerResult | null>(null);
  const [result, setResult] = useState<FinishResult | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);

  const questionStart = useRef(0);
  const started = useRef(false);
  const feedbackRef = useRef<HTMLDivElement>(null);

  async function begin() {
    setError(null);
    try {
      const data = await postJson<StartAttemptResponse>(`/api/lessons/${lessonId}/attempts`);
      setAttempt(data.attempt);
      setQuestions(data.questions);
      setIndex(0);
      setSelected(null);
      setFeedback(null);
      setResult(null);
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

  useEffect(() => {
    if (phase === "feedback") feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [phase]);

  const question = questions[index];

  async function submit(choice: number | null) {
    if (!attempt || !question || busy) return;
    const seconds = Math.max(0, Math.round((Date.now() - questionStart.current) / 1000));
    setBusy(true);
    setError(null);
    try {
      const data = await postJson<AnswerResult>(`/api/attempts/${attempt.id}/answers`, {
        question_id: question.id,
        selected: choice,
        seconds,
      });
      setSelected(choice);
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
    return (
      <div className="grid min-h-dvh place-items-center px-6" aria-busy="true">
        <p className="font-mono text-base text-ink/60">Preparando as questões…</p>
      </div>
    );
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
            <Link href={`/licao/${lessonId}`} className="btn btn-ghost">Voltar para a lição</Link>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "result" && result) {
    return <ResultView result={result} lessonId={lessonId} onRetry={() => { setPhase("loading"); void begin(); }} />;
  }

  if (!question || !attempt) return null;

  const answeredCount = index + (phase === "feedback" ? 1 : 0);
  const isLast = index + 1 === questions.length;

  return (
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-40 pt-4">
      <header className="flex items-center justify-between gap-3">
        <Link href={`/licao/${lessonId}`} aria-label="Sair da prática" className="grid size-11 place-items-center rounded-full text-ink/70 hover:bg-ink/5">
          <X className="size-6" aria-hidden="true" />
        </Link>
        <p className="truncate text-sm text-ink/60">{lessonTitle}</p>
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
          Questão {index + 1} de {attempt.total} · {question.topic}
        </p>
        <h1 className="mt-3 text-2xl">{question.statement}</h1>

        <ul className="mt-6 space-y-3">
          {question.options.map((option, i) => {
            const isSelected = selected === i;
            const showing = phase === "feedback" && feedback;
            const isCorrect = showing && feedback.correct_index === i;
            const isWrongPick = showing && isSelected && !feedback.is_correct;

            let style = "border-ink/15 bg-white hover:border-ink/40";
            if (phase === "answering" && isSelected) style = "border-sky bg-sky-soft";
            if (isCorrect) style = "border-sage bg-sage-soft";
            if (isWrongPick) style = "border-brick bg-brick-soft";
            if (showing && !isCorrect && !isWrongPick) style = "border-ink/10 bg-white opacity-60";

            return (
              <li key={i}>
                <button
                  type="button"
                  disabled={phase !== "answering" || busy}
                  aria-pressed={isSelected}
                  onClick={() => setSelected(i)}
                  className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-base transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${style}`}
                >
                  <span className={`grid size-8 shrink-0 place-items-center rounded-full font-mono text-sm font-medium ${isCorrect ? "bg-sage text-ink" : isWrongPick ? "bg-brick text-white" : "bg-ink/8"}`}>
                    {isCorrect ? <Check className="size-4" aria-hidden="true" /> : isWrongPick ? <X className="size-4" aria-hidden="true" /> : optionLetter(i)}
                  </span>
                  <span>{option}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {error && <p role="alert" className="mt-4 rounded-2xl bg-brick-soft px-4 py-3 text-base text-brick">{error}</p>}

        {phase === "feedback" && feedback && (
          <div ref={feedbackRef} className="anim-rise mt-6 space-y-4">
            <div className={`rounded-2xl px-5 py-4 ${feedback.is_correct ? "bg-sage-soft" : selected === null ? "bg-paper-2" : "bg-brick-soft"}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-2xl font-bold">
                  {feedback.is_correct ? "Acertou!" : selected === null ? "Você pulou esta" : "Não foi dessa vez"}
                </p>
                {feedback.xp ? (
                  <span className="anim-pop inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1 font-mono text-base font-medium">
                    <Star className="size-4 text-coral" aria-hidden="true" /> +{feedback.xp} XP
                  </span>
                ) : null}
              </div>
              {!feedback.is_correct && (
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

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-md gap-3 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {phase === "answering" ? (
            <>
              <button type="button" className="btn btn-ghost border-2 border-ink/15" disabled={busy} onClick={() => submit(null)}>
                <SkipForward className="size-5" aria-hidden="true" /> Pular
              </button>
              <button type="button" className="btn btn-primary flex-1" disabled={selected === null || busy} onClick={() => submit(selected)}>
                {busy ? "Enviando…" : "Confirmar"}
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-dark flex-1" disabled={busy} onClick={next}>
              {busy ? "Um instante…" : isLast ? "Ver resultado" : "Próxima questão"} <ArrowRight className="size-5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultView({ result, lessonId, onRetry }: { result: FinishResult; lessonId: number; onRetry: () => void }) {
  const headline = result.percent >= 80 ? "Mandou bem!" : result.percent >= 50 ? "Bom caminho." : "Agora você conhece as pegadinhas.";
  const g = result.gamification;
  const celebrate = result.is_record || (g?.new_badges.length ?? 0) > 0;
  const diff = result.is_record && result.previous_best_avg_seconds !== null && result.avg_seconds !== null
    ? result.previous_best_avg_seconds - result.avg_seconds
    : null;

  return (
    <div className="relative mx-auto min-h-dvh max-w-md px-5 pb-12 pt-8">
      {celebrate && <Confetti />}
      <Trophy className="size-10 text-coral" aria-hidden="true" />
      <p className="label-mono mt-4">Lição concluída</p>
      <h1 className="anim-rise mt-2 text-4xl">{headline}</h1>

      <div className="mt-8">
        <div className="flex items-end justify-between">
          <p className="font-mono text-4xl font-medium">{result.percent}%</p>
          <p className="text-base text-ink/70">{result.correct} de {pluralize(result.total, "questão", "questões")}</p>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-ink/10">
          <div className="anim-fill h-full rounded-full bg-sage" style={{ width: `${result.percent}%` }} />
        </div>
      </div>

      <dl className="mt-8 space-y-4">
        {result.avg_seconds !== null && (
          <div className="flex items-start gap-3 rounded-2xl bg-white px-5 py-4 shadow-lift">
            <Timer className="mt-0.5 size-5 shrink-0 text-coral" aria-hidden="true" />
            <div>
              <dt className="text-sm text-ink/60">Tempo médio por questão</dt>
              <dd className="font-mono text-2xl font-medium">{formatSeconds(result.avg_seconds)}</dd>
              {result.is_record && diff !== null ? (
                <p className="mt-1 text-base font-bold text-sage">Novo recorde: {formatSeconds(diff)} mais rápido que o anterior.</p>
              ) : result.previous_best_avg_seconds !== null ? (
                <p className="mt-1 text-base text-ink/70">Seu recorde: {formatSeconds(result.previous_best_avg_seconds)}.</p>
              ) : (
                <p className="mt-1 text-base text-ink/70">Esse é o tempo para bater na próxima vez.</p>
              )}
            </div>
          </div>
        )}
        {result.weak_topic && (
          <div className="flex items-start gap-3 rounded-2xl bg-coral-soft px-5 py-4">
            <Target className="mt-0.5 size-5 shrink-0 text-coral" aria-hidden="true" />
            <div>
              <dt className="text-sm text-ink/60">Ponto para reforçar</dt>
              <dd className="text-base font-bold">{result.weak_topic}</dd>
              <Link href={`/licao/${lessonId}`} className="mt-1 inline-block text-base font-bold underline underline-offset-4">
                Revisar a lição
              </Link>
            </div>
          </div>
        )}
      </dl>

      {g && (
        <section aria-labelledby="pontos" className="mt-6 space-y-4">
          <h2 id="pontos" className="sr-only">Pontos e conquistas</h2>
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-5 py-4 shadow-lift">
            <div className="flex items-center gap-3">
              <Star className="size-5 shrink-0 text-coral" aria-hidden="true" />
              <div>
                <p className="text-sm text-ink/60">XP ganho nesta lição</p>
                <p className="font-mono text-2xl font-medium">+{formatNumber(g.xp_earned)} XP</p>
              </div>
            </div>
            <p className="text-right text-sm text-ink/60">
              Total
              <span className="block font-mono text-base font-medium text-ink">{formatNumber(g.xp_total)}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-coral-soft px-5 py-4">
            <Flame className="size-5 shrink-0 text-coral" aria-hidden="true" />
            <p className="text-base font-bold">{streakMessage(g.streak.current)}</p>
          </div>

          {g.new_badges.length > 0 && (
            <div>
              <h3 className="text-2xl">{g.new_badges.length === 1 ? "Nova conquista!" : "Novas conquistas!"}</h3>
              <ul className="mt-3 space-y-3">
                {g.new_badges.map((badge, i) => (
                  <li
                    key={badge.key}
                    className="anim-pop flex items-center gap-4 rounded-2xl border-2 border-sage bg-sage-soft px-5 py-4"
                    style={{ animationDelay: `${i * 140}ms` }}
                  >
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-sage">
                      <BadgeIcon badgeKey={badge.key} className="size-6" />
                    </span>
                    <span>
                      <span className="block text-base font-bold">{badge.name}</span>
                      <span className="block text-sm text-ink/70">{badge.description}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
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

      <div className="mt-8 flex flex-col gap-3">
        {result.next_lesson ? (
          <Link href={`/licao/${result.next_lesson.id}`} className="btn btn-primary">
            Próxima: {result.next_lesson.title} <ArrowRight className="size-5" aria-hidden="true" />
          </Link>
        ) : null}
        <button type="button" className={`btn ${result.next_lesson ? "btn-ghost border-2 border-ink/15" : "btn-primary"}`} onClick={onRetry}>
          <RotateCcw className="size-5" aria-hidden="true" /> Praticar de novo
        </button>
        <Link href="/inicio" className="btn btn-ghost">
          <ArrowLeft className="size-5" aria-hidden="true" /> Voltar ao início
        </Link>
      </div>
    </div>
  );
}
