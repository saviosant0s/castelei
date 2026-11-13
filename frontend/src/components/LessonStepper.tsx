"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Pause,
  Volume2,
  X,
} from "lucide-react";
import { LessonVideo } from "@/components/LessonVideo";
import { StepCode } from "@/components/StepCode";
import { StepExample } from "@/components/StepExample";
import { StepTable } from "@/components/StepTable";
import { useNarration } from "@/components/useNarration";
import { postJson } from "@/lib/client";
import { clearSpot, saveSpot, useSpot } from "@/lib/lesson-progress";
import { narrationSrc } from "@/lib/narration";
import type { LessonDetail, StepKind } from "@/lib/types";

const KIND: Record<
  StepKind,
  { label: string }
> = {
  idea: { label: "Para começar" },
  explain: { label: "Explicando" },
  exam: { label: "Como cai na prova" },
  pitfall: { label: "Pegadinhas" },
  recap: { label: "Resumo em 1 minuto" },
};

/** A lição, uma ideia por tela. */
/** A mesma régua do Progresso: 80% das questões de base certas na última resposta. */
export function dominada(mastery: number | null | undefined): boolean {
  return typeof mastery === "number" && mastery >= 80;
}

export function LessonStepper({ lesson }: { lesson: LessonDetail }) {
  const steps = lesson.steps;

  /*
  | Retomar de onde parou.
  |
  | A etapa salva não vira estado: ela é lida e usada como ponto de partida
  | enquanto a pessoa não tiver escolhido nenhuma etapa nesta visita. Assim a
  | retomada não depende de um efeito que corrige o estado depois de montar —
  | o que causaria uma renderização em cascata e um pulo visível na tela.
  |
  | Só vale se a lição continua com o mesmo tamanho. Se o conteúdo foi
  | reescrito e ganhou ou perdeu etapas, a etapa 7 de antes não é a etapa 7
  | de agora, e devolver a pessoa ao meio do texto errado é pior do que
  | recomeçar.
  */
  const saved = useSpot(lesson.id);
  const resumeAt = saved && saved.total === steps.length ? saved.step : null;

  /** A etapa escolhida nesta visita. `null` = ainda não mexeu. */
  const [chosen, setChosen] = useState<number | null>(null);
  const index = chosen ?? resumeAt ?? 0;

  const step = steps[index];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;
  /** O aviso da retomada some assim que a pessoa avança: já não é novidade. */
  const showResumed = chosen === null && resumeAt !== null;

  /*
  | Andar pela lição.
  |
  | A forma funcional parte de `chosen ?? resumeAt ?? 0`, e não de `index`,
  | porque o atalho de teclado vive dentro de um efeito: sem isso ele
  | enxergaria o índice da renderização em que foi registrado.
  */
  const move = useCallback(
    (delta: number) =>
      setChosen((current) => {
        const from = current ?? resumeAt ?? 0;
        return Math.min(Math.max(from + delta, 0), steps.length - 1);
      }),
    [resumeAt, steps.length],
  );

  const next = () => move(1);
  const back = () => move(-1);

  /*
  | Ouvir a lição. Terminou a etapa, a lição avança e a voz segue; na última
  | ela para, porque dali em diante são questões, e questão se responde
  | lendo. O botão só aparece na etapa que já tem áudio gravado.
  */
  const audioSrc = step ? narrationSrc(step) : null;
  const narration = useNarration(audioSrc, () => {
    if (isLast) return false;
    move(1);
    return true;
  });

  // Cada etapa começa no topo da tela.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [index]);

  /*
  | Só grava o que a pessoa realmente navegou.
  |
  | Gravar `index` gravaria também o zero da primeira renderização — aquela em
  | que a etapa salva ainda não foi lida —, e o zero apaga a marca. Quem abre
  | a lição e sai sem tocar em nada mantém onde estava.
  */
  useEffect(() => {
    if (chosen === null) return;
    saveSpot(lesson.id, chosen, steps.length);
  }, [lesson.id, chosen, steps.length]);

  /*
  | Chegou à última etapa andando pela lição: ela conta como LIDA, e a trilha
  | passa a mostrá-la pela metade até a prática. Só conta quem navegou
  | (`chosen`): abrir a lição não é ler. Falhou, tudo bem — é um aviso para a
  | trilha, nunca motivo para atrapalhar quem está lendo.
  */
  const avisouLeitura = useRef(false);
  useEffect(() => {
    if (!isLast || chosen === null || avisouLeitura.current) return;
    avisouLeitura.current = true;
    postJson(`/api/lessons/${lesson.id}/read`).catch(() => {});
  }, [isLast, chosen, lesson.id]);

  // Setas do teclado, para quem estuda no computador.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") move(1);
      if (event.key === "ArrowLeft") move(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);

  if (!step) return null;
  const meta = KIND[step.kind];

  return (
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-44 pt-4">
      <header className="flex items-center justify-between gap-3">
        <Link
          href={`/licao/${lesson.id}`}
          aria-label="Sair da leitura e voltar para a lição"
          className="grid size-11 place-items-center rounded-full text-ink/70 hover:bg-ink/5"
        >
          <X className="size-6" aria-hidden="true" />
        </Link>
        <p className="font-mono text-sm font-medium text-ink/60">
          Etapa {index + 1} de {steps.length}
        </p>
        <Link
          href={`/licao/${lesson.id}/praticar`}
          className="min-h-11 content-center px-2 text-sm font-bold text-ink/70 underline underline-offset-4"
        >
          Ir às questões
        </Link>
      </header>

      <div
        className="mt-3 flex gap-1"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={index + 1}
        aria-label="Progresso da lição"
      >
        {steps.map((s, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i < index ? "bg-ink" : i === index ? "bg-sky" : "bg-ink/15"}`}
          />
        ))}
      </div>

      {/*
      | Retomar sem avisar é desorientador: a pessoa abre a lição e o texto
      | está no meio, sem explicação. O aviso conta o que aconteceu e deixa a
      | saída à mão. Some assim que ela avança, porque aí já não é novidade.
      */}
      {showResumed && (
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-control bg-sky-soft px-4 py-2.5 text-sm">
          <span>Você tinha parado aqui.</span>
          <button
            type="button"
            onClick={() => {
              clearSpot(lesson.id);
              setChosen(0);
            }}
            className="min-h-11 font-bold underline underline-offset-4"
          >
            Começar do início
          </button>
        </p>
      )}

      {/*
      | Quem já domina a lição não precisa reler tudo: o apoio que ajuda quem
      | começa atrapalha quem já sabe (efeito de reversão da especialização).
      | O app não esconde as etapas — oferece o atalho, e só na primeira tela.
      | Ver docs/principios-pedagogicos.md.
      */}
      {index === 0 && !showResumed && dominada(lesson.mastery) && (
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-control bg-sage-soft px-4 py-2.5 text-sm">
          <span>Você já domina esta lição ({lesson.mastery}%).</span>
          <Link
            href={`/licao/${lesson.id}/praticar`}
            className="min-h-11 content-center font-bold underline underline-offset-4"
          >
            Ir direto às questões
          </Link>
        </p>
      )}

      <p className="mt-8 text-sm text-ink/60">{lesson.title}</p>

      <article key={index} className="anim-rise mt-2">
        <div className="flex items-center justify-between gap-3">
          {/*
            O tipo da etapa vai como rótulo de texto, sem selo, ícone nem fonte
            de máquina: selo em pílula com ícone era um dos sinais de tela
            gerada por IA. E some quando repete o título da etapa ("Resumo em
            1 minuto" aparecia duas vezes, uma em cima da outra).
          */}
          {meta.label !== step.title ? <p className="label-mono">{meta.label}</p> : <span />}
          {audioSrc && (
            <button
              type="button"
              onClick={narration.toggle}
              aria-pressed={narration.playing}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-ink/15 px-4 text-sm font-bold hover:bg-ink/5"
            >
              {narration.playing ? (
                <>
                  <Pause className="size-4" aria-hidden="true" /> Pausar
                </>
              ) : (
                <>
                  <Volume2 className="size-4" aria-hidden="true" /> Ouvir
                </>
              )}
            </button>
          )}
        </div>
        <h1 className="mt-4 text-2xl sm:text-4xl">{step.title}</h1>

        <div className="mt-5 space-y-4 text-base leading-relaxed">
          {step.body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        {step.figure && (
          <figure className="mt-6 overflow-hidden rounded-2xl bg-surface-raised p-3 shadow-lift">
            {/* SVG estático do próprio app: o next/image não agrega nada aqui */}
            {/* A folha é branca nos dois temas: a figura é desenhada a tinta
                escura, e no escuro traço e texto solto sumiriam no cartão. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={step.figure.src}
              alt={step.figure.alt}
              className="h-auto w-full rounded-xl bg-sheet"
              loading="lazy"
            />
            {(step.figure.caption || step.figure.credit) && (
              <figcaption className="mt-2 px-2 pb-1 text-sm text-ink/70">
                {step.figure.caption}
                {/*
                  Foto real com licença livre pede o crédito do autor. Fica numa
                  linha pequena, depois da legenda: é exigência da licença, não
                  parte da explicação.
                */}
                {step.figure.credit && (
                  <a
                    href={step.figure.credit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-xs text-content-subtle underline-offset-2 hover:underline"
                  >
                    Foto: {step.figure.credit.author} · {step.figure.credit.license}
                  </a>
                )}
              </figcaption>
            )}
          </figure>
        )}

        {step.video && <LessonVideo video={step.video} />}

        {step.example && <StepExample example={step.example} />}

        {step.table && <StepTable table={step.table} />}

        {step.code && <StepCode code={step.code} />}

        {step.bullets && (
          <ul className="mt-6 space-y-3 text-base leading-relaxed">
            {step.bullets.map((bullet, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className="mt-2.5 size-1.5 shrink-0 rounded-full bg-ink"
                  aria-hidden="true"
                />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        )}

        {/*
          As palavras novas moram num cartão só.
          
          A regra de explicar todo termo na estreia é boa, e a conferência do
          Guia Editorial a tornou obrigatória — o efeito colateral foi uma
          etapa com cinco caixas azuis iguais, cada uma repetindo o rótulo
          "palavra nova". Trocamos um paredão de parágrafo por um paredão
          azul. Agora o rótulo aparece uma vez, e as palavras são linhas
          separadas por um traço fino.
        */}
        {step.terms && step.terms.length > 0 && (
          <div className="mt-6 rounded-2xl bg-sky-soft px-5 py-4">
            <p className="label-mono">
              {step.terms.length === 1 ? "Palavra nova" : "Palavras novas"}
            </p>
            <dl className="mt-1 divide-y divide-ink/10">
              {step.terms.map((term) => (
                <div key={term.word} className="py-2 first:pt-0 last:pb-0">
                  <dt className="inline font-bold">{term.word}: </dt>
                  <dd className="inline text-base leading-relaxed">{term.meaning}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </article>


      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-surface/95 backdrop-blur">
        <div className="mx-auto max-w-md px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div className="flex gap-3">
            {!isFirst && (
              <button
                type="button"
                onClick={back}
                className="btn btn-ghost shrink-0 border-2 border-ink/15"
                aria-label="Voltar para a etapa anterior"
              >
                <ArrowLeft className="size-5" aria-hidden="true" /> Voltar
              </button>
            )}
            {/*
            | A última etapa termina na tela da lição, e não nas questões. Ali
            | estão "Fazer as questões" (agora em destaque), a dúvida e a
            | anotação. Antes elas se espremiam aqui, com um botão de voltar
            | só de seta, e o fim da leitura parecia mal encaixado.
            */}
            {isLast ? (
              <Link href={`/licao/${lesson.id}`} className="btn btn-primary min-w-0 flex-1 whitespace-nowrap px-4">
                Concluir leitura <Check className="size-5" aria-hidden="true" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={next}
                className="btn btn-primary flex-1"
              >
                Continuar <ArrowRight className="size-5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
