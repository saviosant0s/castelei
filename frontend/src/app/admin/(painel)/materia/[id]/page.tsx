import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LessonList } from "@/components/admin/LessonList";
import { NewLessonForm } from "@/components/admin/NewLessonForm";
import { OriginBadge } from "@/components/admin/OriginBadge";
import { SubjectEditor } from "@/components/admin/SubjectEditor";
import { Callout } from "@/components/ui";
import { adminGet } from "@/lib/admin";
import type { AdminSubjectDetail } from "@/lib/admin-types";

interface Props {
  params: Promise<{ id: string }>;
}

async function carregar(params: Props["params"]) {
  const { id } = await params;
  return adminGet<{ subject: AdminSubjectDetail }>(`/subjects/${id}`);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subject } = await carregar(params);
  return { title: subject.name };
}

export default async function MateriaNoPainel({ params }: Props) {
  const { subject } = await carregar(params);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-base text-content-secondary underline underline-offset-4"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Todas as matérias
        </Link>

        <header className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl">{subject.name}</h1>
          <OriginBadge origin={subject.origin} />
        </header>
      </div>

      {subject.origin === "seed" && (
        <Callout role="info">
          Esta matéria vem dos arquivos do repositório e é recarregada a cada publicação do app. Na primeira edição
          feita aqui ela passa para o painel, e a publicação deixa de mexer nela.
        </Callout>
      )}

      <section aria-labelledby="licoes" className="space-y-4">
        <h2 id="licoes" className="text-2xl">
          Lições
        </h2>
        <LessonList subjectId={subject.id} lessons={subject.lessons} />
        <NewLessonForm subjectId={subject.id} />
      </section>

      <section aria-labelledby="ajustes" className="space-y-4">
        <h2 id="ajustes" className="text-2xl">
          Ajustes
        </h2>
        <SubjectEditor subject={subject} />
      </section>
    </div>
  );
}
