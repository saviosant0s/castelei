import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, ClipboardCheck, Crown } from "lucide-react";
import { LessonSpot } from "@/components/LessonSpot";
import { Callout, Card, ListRow } from "@/components/ui";
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
      <Link href="/inicio" className="inline-flex min-h-11 items-center gap-2 text-base text-content-secondary hover:text-ink">
        <ArrowLeft className="size-5" aria-hidden="true" /> Início
      </Link>

      <header>
        <h1 className="text-4xl">{subject.name}</h1>
        {subject.description && <p className="mt-3 text-base text-content-secondary">{subject.description}</p>}
      </header>

      {subject.exam.available &&
        (subject.exam.unlocked ? (
          <Card tone="bold" size="lg" href={`/simulado/${subject.slug}`} className="flex items-center gap-4">
            <ClipboardCheck className="size-6 shrink-0 text-sky" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-base font-bold">Simulado da matéria</span>
              <span className="block text-sm on-bold-secondary">
                {pluralize(subject.exam.questions, "questão sorteada", "questões sorteadas")} de todas as lições
              </span>
            </span>
            <ChevronRight className="size-5 shrink-0 on-bold-subtle" aria-hidden="true" />
          </Card>
        ) : (
          <Callout role="bloqueado" icon={ClipboardCheck} href="/planos">
            <strong>Simulado da matéria.</strong> Mistura questões de todas as lições — faz parte do plano Pro.
          </Callout>
        ))}

      <ol className="space-y-3">
        {subject.lessons.map((lesson) => (
          <li key={lesson.id}>
            <ListRow
              href={`/licao/${lesson.id}`}
              leading={lesson.position}
              title={lesson.title}
              meta={
                <>
                  {pluralize(lesson.questions_available, "questão", "questões")}
                  {lesson.best_percent !== null && ` · melhor: ${lesson.best_percent}%`}
                  {/* "ainda não praticada" sai daqui: quem parou no meio da
                      leitura já começou, e as duas frases se contradizem. */}
                  <LessonSpot lessonId={lesson.id} practiced={lesson.best_percent !== null} />
                </>
              }
            />
          </li>
        ))}
      </ol>

      {limited && (
        <Callout role="bloqueado" icon={Crown} href="/planos">
          No plano grátis cada lição traz parte das questões. <strong>Veja o que o Plus libera.</strong>
        </Callout>
      )}
    </div>
  );
}
