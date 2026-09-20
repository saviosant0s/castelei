"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Check, Lightbulb, Play, Sparkles, Target, X, type LucideIcon } from "lucide-react";
import { pluralize } from "@/lib/format";
import type { LessonDetail, StepKind } from "@/lib/types";

const KIND: Record<StepKind, { label: string; icon: LucideIcon; chip: string }> = {
  idea: { label: "Para começar", icon: Sparkles, chip: "bg-sky-soft" },
  explain: { label: "Explicando", icon: BookOpen, chip: "bg-paper-2" },
  exam: { label: "Como cai na prova", icon: Target, chip: "bg-coral-soft" },
  pitfall: { label: "Pegadinhas", icon: Lightbulb, chip: "bg-coral-soft" },
  recap: { label: "Resumo em 1 minuto", icon: Check, chip: "bg-sage-soft" },
};

/** A lição, uma ideia por tela. */
export function LessonStepper({ lesson }: { lesson: LessonDetail }) {
  const steps = lesson.steps;
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  const next = () => setIndex((i) => Math.min(i + 1, steps.length - 1));
  const back = () => setIndex((i) => Math.max(i - 1, 0));

  // Cada etapa começa no topo da tela.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [index]);

  // Setas do teclado, para quem estuda no computador.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") setIndex((i) => Math.min(i + 1, steps.length - 1));
      if (event.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [steps.length]);

  if (!step) return null;
  const meta = KIND[step.kind];
  const Icon = meta.icon;

  return (
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-44 pt-4">
      <header className="flex items-center justify-between gap-3">
        <Link
          href={`/materia/${lesson.subject.slug}`}
          aria-label={`Sair da lição e voltar para ${lesson.subject.name}`}
          className="grid size-11 place-items-center rounded-full text-ink/70 hover:bg-ink/5"
        >
          <X className="size-6" aria-hidden="true" />
        </Link>
        <p className="font-mono text-sm font-medium text-ink/60">
          Etapa {index + 1} de {steps.length}
        </p>
        <Link href={`/licao/${lesson.id}/praticar`} className="min-h-11 content-center px-2 text-sm font-bold text-ink/70 underline underline-offset-4">
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
          <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < index ? "bg-ink" : i === index ? "bg-sky" : "bg-ink/15"}`} />
        ))}
      </div>

      <p className="mt-8 text-sm text-ink/60">{lesson.title}</p>

      <article key={index} className="anim-rise mt-2">
        <p className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-sm font-medium ${meta.chip}`}>
          <Icon className="size-4" aria-hidden="true" /> {meta.label}
        </p>
        <h1 className="mt-4 text-2xl sm:text-4xl">{step.title}</h1>

        <div className="mt-5 space-y-4 text-base leading-relaxed">
          {step.body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        {step.figure && (
          <figure className="mt-6 overflow-hidden rounded-2xl bg-white p-3 shadow-lift">
            {/* SVG estático do próprio app: o next/image não agrega nada aqui */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={step.figure.src} alt={step.figure.alt} className="h-auto w-full" loading="lazy" />
            {step.figure.caption && <figcaption className="mt-2 px-2 pb-1 text-sm text-ink/70">{step.figure.caption}</figcaption>}
          </figure>
        )}

        {step.example && (
          <div className="mt-6 rounded-2xl bg-white p-5 shadow-lift">
            <p className="label-mono">{step.example.label}</p>
            <ol className="mt-3 space-y-2 font-mono text-base">
              {step.example.lines.map((line, i) => (
                <li key={i} className={i === step.example!.lines.length - 1 ? "font-medium" : "text-ink/80"}>
                  {line}
                </li>
              ))}
            </ol>
          </div>
        )}

        {step.table && (
          <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-lift">
            {step.table.label && <p className="label-mono px-4 pt-4">{step.table.label}</p>}
            <div className="overflow-x-auto">
              <table className="mt-2 w-full min-w-[26rem] text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-ink/15">
                    {step.table.headers.map((header) => (
                      <th key={header} scope="col" className="px-4 py-2.5 font-bold">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {step.table.rows.map((row, r) => (
                    <tr key={r} className="border-t border-ink/10">
                      {row.map((cell, c) => (
                        <td key={c} className={`break-words px-4 py-2.5 align-top ${step.table!.mono && c > 0 ? "font-mono" : ""}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step.code && (
          <div className="mt-6">
            {step.code.label && <p className="label-mono mb-2">{step.code.label}</p>}
            <pre className="overflow-x-auto rounded-2xl bg-ink p-4 font-mono text-sm leading-relaxed text-paper">
              <code>{step.code.text}</code>
            </pre>
          </div>
        )}

        {step.bullets && (
          <ul className="mt-6 space-y-3 text-base leading-relaxed">
            {step.bullets.map((bullet, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-ink" aria-hidden="true" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        )}

        {step.terms && (
          <div className="mt-6 space-y-3">
            {step.terms.map((term) => (
              <div key={term.word} className="rounded-2xl bg-sky-soft px-5 py-4">
                <p className="label-mono">Palavra nova</p>
                <p className="mt-1 text-base leading-relaxed">
                  <strong>{term.word}:</strong> {term.meaning}
                </p>
              </div>
            ))}
          </div>
        )}
      </article>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-paper/95 backdrop-blur">
        <div className="mx-auto max-w-md px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {isLast && lesson.limited_by_plan && (
            <p className="mb-2 text-center text-sm text-ink/60">
              Plano grátis: {lesson.questions_available} de {lesson.questions_total} questões.{" "}
              <Link href="/planos" className="font-bold text-ink underline underline-offset-4">
                Ver Plus
              </Link>
            </p>
          )}
          <div className="flex gap-3">
            {!isFirst && (
              <button type="button" onClick={back} className="btn btn-ghost border-2 border-ink/15" aria-label="Voltar para a etapa anterior">
                <ArrowLeft className="size-5" aria-hidden="true" /> Voltar
              </button>
            )}
            {isLast ? (
              <Link href={`/licao/${lesson.id}/praticar`} className="btn btn-primary flex-1">
                <Play className="size-5" aria-hidden="true" /> Praticar {pluralize(lesson.questions_available, "questão", "questões")}
              </Link>
            ) : (
              <button type="button" onClick={next} className="btn btn-primary flex-1">
                Continuar <ArrowRight className="size-5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
