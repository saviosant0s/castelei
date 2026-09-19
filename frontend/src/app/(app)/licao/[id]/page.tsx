import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Lightbulb, Play, Target } from "lucide-react";
import { serverGet } from "@/lib/backend";
import { pluralize } from "@/lib/format";
import type { LessonDetail } from "@/lib/types";

export const metadata: Metadata = { title: "Lição" };

export default async function LicaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { lesson } = await serverGet<{ lesson: LessonDetail }>(`/lessons/${encodeURIComponent(id)}`);

  return (
    <div className="pb-24">
      <Link href={`/materia/${lesson.subject.slug}`} className="inline-flex min-h-11 items-center gap-2 text-base text-ink/70 hover:text-ink">
        <ArrowLeft className="size-5" aria-hidden="true" /> {lesson.subject.name}
      </Link>

      <h1 className="mt-4 text-4xl">{lesson.title}</h1>

      <section aria-labelledby="resumo" className="mt-6 rounded-3xl bg-sky-soft p-6">
        <h2 id="resumo" className="label-mono">Resumo em 1 minuto</h2>
        <p className="mt-3 text-base leading-relaxed">{lesson.summary}</p>
      </section>

      <section aria-labelledby="explicacao" className="mt-10">
        <h2 id="explicacao" className="text-2xl">Explicando do jeito humano</h2>
        <div className="mt-4 space-y-4 text-base leading-relaxed">
          {lesson.explanation.split("\n\n").map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section aria-labelledby="prova" className="mt-10 rounded-3xl bg-paper-2 p-6">
        <h2 id="prova" className="flex items-center gap-2 text-2xl">
          <Target className="size-6 text-coral" aria-hidden="true" /> Como cai na prova
        </h2>
        <p className="mt-3 text-base leading-relaxed">{lesson.exam_style}</p>
      </section>

      <section aria-labelledby="pegadinhas" className="mt-10">
        <h2 id="pegadinhas" className="flex items-center gap-2 text-2xl">
          <Lightbulb className="size-6 text-coral" aria-hidden="true" /> Pegadinhas clássicas
        </h2>
        <ul className="mt-4 space-y-3">
          {lesson.pitfalls.map((pitfall) => (
            <li key={pitfall} className="rounded-2xl border-2 border-coral/40 bg-coral-soft px-5 py-3 text-base">
              {pitfall}
            </li>
          ))}
        </ul>
      </section>

      <div className="fixed inset-x-0 bottom-16 z-10 border-t border-ink/10 bg-paper/95 backdrop-blur">
        <div className="mx-auto max-w-md px-5 py-3">
          <Link href={`/licao/${lesson.id}/praticar`} className="btn btn-primary w-full">
            <Play className="size-5" aria-hidden="true" /> Praticar {pluralize(lesson.questions_available, "questão", "questões")}
          </Link>
          {lesson.limited_by_plan && (
            <p className="mt-2 text-center text-sm text-ink/60">
              Plano grátis: {lesson.questions_available} de {lesson.questions_total} questões.{" "}
              <Link href="/planos" className="font-bold text-ink underline underline-offset-4">Ver Plus</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
