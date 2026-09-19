import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, Crown } from "lucide-react";
import { serverGet } from "@/lib/backend";
import { pluralize } from "@/lib/format";
import type { Subject } from "@/lib/types";

export const metadata: Metadata = { title: "Matéria" };

export default async function MateriaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { subjects } = await serverGet<{ subjects: Subject[] }>("/subjects");
  const subject = subjects.find((s) => s.slug === slug);
  if (!subject) notFound();

  const limited = subject.lessons.some((l) => l.questions_available < l.questions_total);

  return (
    <div className="space-y-8">
      <Link href="/inicio" className="inline-flex min-h-11 items-center gap-2 text-base text-ink/70 hover:text-ink">
        <ArrowLeft className="size-5" aria-hidden="true" /> Início
      </Link>

      <header>
        <h1 className="text-4xl">{subject.name}</h1>
        {subject.description && <p className="mt-3 text-base text-ink/70">{subject.description}</p>}
      </header>

      <ol className="space-y-3">
        {subject.lessons.map((lesson) => (
          <li key={lesson.id}>
            <Link
              href={`/licao/${lesson.id}`}
              className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-lift transition hover:-translate-y-0.5"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-paper-2 font-mono text-base font-medium">
                {lesson.position}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-bold">{lesson.title}</span>
                <span className="block text-sm text-ink/60">
                  {pluralize(lesson.questions_available, "questão", "questões")}
                  {lesson.best_percent !== null ? ` · melhor: ${lesson.best_percent}%` : " · ainda não praticada"}
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-ink/40" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ol>

      {limited && (
        <Link href="/planos" className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-ink/25 px-5 py-4 hover:border-ink/50">
          <Crown className="size-5 shrink-0 text-sky" aria-hidden="true" />
          <span className="text-base">
            No plano grátis cada lição traz parte das questões. <strong>Veja o que o Plus libera.</strong>
          </span>
        </Link>
      )}
    </div>
  );
}
