import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { LessonEditor } from "@/components/admin/LessonEditor";
import { QuestionList } from "@/components/admin/QuestionList";
import { adminGet } from "@/lib/admin";
import type { AdminLessonDetail } from "@/lib/admin-types";

interface Props {
  params: Promise<{ id: string }>;
}

async function carregar(params: Props["params"]) {
  const { id } = await params;
  return adminGet<{ lesson: AdminLessonDetail }>(`/lessons/${id}`);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lesson } = await carregar(params);
  return { title: lesson.title };
}

export default async function LicaoNoPainel({ params }: Props) {
  const { lesson } = await carregar(params);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Link
          href={`/admin/materia/${lesson.subject.id}`}
          className="inline-flex items-center gap-1.5 text-base text-content-secondary underline underline-offset-4"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {lesson.subject.name}
        </Link>

        <header className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <h1 className="text-3xl">{lesson.title}</h1>
          {/* Ver como ficou de verdade, do jeito que o aluno vê. */}
          <Link
            href={`/licao/${lesson.id}`}
            className="inline-flex items-center gap-1.5 text-base text-content-secondary underline underline-offset-4"
          >
            Ver no app
            <ExternalLink className="size-4" aria-hidden="true" />
          </Link>
        </header>
      </div>

      <section aria-labelledby="texto" className="space-y-4">
        <h2 id="texto" className="text-2xl">
          Texto da lição
        </h2>
        <LessonEditor lesson={lesson} />
      </section>

      <section aria-labelledby="questoes" className="space-y-4">
        <h2 id="questoes" className="text-2xl">
          Questões
        </h2>
        <QuestionList lessonId={lesson.id} questions={lesson.questions} />
      </section>
    </div>
  );
}
