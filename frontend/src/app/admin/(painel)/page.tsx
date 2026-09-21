import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { NewSubjectForm } from "@/components/admin/NewSubjectForm";
import { OriginBadge } from "@/components/admin/OriginBadge";
import { Card, EmptyState } from "@/components/ui";
import { adminGet } from "@/lib/admin";
import type { AdminSubject } from "@/lib/admin-types";

export default async function PainelInicio() {
  const { subjects } = await adminGet<{ subjects: AdminSubject[] }>("/subjects");

  const licoes = subjects.reduce((total, subject) => total + subject.lessons_count, 0);
  const questoes = subjects.reduce((total, subject) => total + subject.questions_count, 0);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl">Conteúdo do Castelei</h1>
        <p className="text-base text-content-secondary">
          {subjects.length} {subjects.length === 1 ? "matéria" : "matérias"} · {licoes}{" "}
          {licoes === 1 ? "lição" : "lições"} · {questoes} {questoes === 1 ? "questão" : "questões"} no ar.
        </p>
      </header>

      {subjects.length === 0 ? (
        <EmptyState
          title="Nenhuma matéria ainda"
          description="Importe um arquivo pronto ou crie uma matéria vazia e escreva as lições aqui."
          action={{ label: "Importar matéria", href: "/admin/importar" }}
          level="h2"
        />
      ) : (
        <ul className="space-y-3">
          {subjects.map((subject) => (
            <li key={subject.id}>
              <Card href={`/admin/materia/${subject.id}`} className="flex items-center gap-4">
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-xl font-bold">{subject.name}</span>
                    <OriginBadge origin={subject.origin} />
                  </span>
                  <span className="mt-1 block text-base text-content-secondary">
                    {subject.lessons_count} {subject.lessons_count === 1 ? "lição" : "lições"} ·{" "}
                    {subject.questions_count} {subject.questions_count === 1 ? "questão" : "questões"} ·{" "}
                    <code className="font-mono text-sm text-content-subtle">{subject.slug}</code>
                  </span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-content-faint" aria-hidden="true" />
              </Card>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/importar"
          className="select-none rounded-control bg-surface-bold px-4 py-2.5 text-base font-bold text-paper shadow-lift"
        >
          Importar matéria
        </Link>
        <NewSubjectForm />
      </div>
    </div>
  );
}
