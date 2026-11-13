import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { Card, ListRow, PageHero } from "@/components/ui";
import { CreateClassroomForm } from "@/components/classroom/CreateClassroomForm";
import { JoinByCode } from "@/components/classroom/JoinByCode";
import { serverGet } from "@/lib/backend";
import type { ClassroomsIndex } from "@/lib/classrooms";

export const metadata: Metadata = { title: "Turmas" };

/*
| Turmas: entrar com o código do professor, ou criar a própria.
|
| Entrar vem primeiro na tela porque é o caso de quase todo mundo: há muito
| mais aluno do que professor. Criar fica embaixo, e é do Pro.
*/
export default async function TurmasPage() {
  const { owned, joined, can_create, subjects } = await serverGet<ClassroomsIndex>("/classrooms");

  return (
    <div className="space-y-8">
      <PageHero eyebrow="Estudo" title="Turmas">
        Estude a matéria junto com a sua turma.
      </PageHero>

      <section aria-labelledby="h-entrar" className="space-y-3">
        <h2 id="h-entrar" className="text-xl">Tenho um código</h2>
        <JoinByCode />
      </section>

      {joined.length > 0 && (
        <section aria-labelledby="h-estou" className="space-y-3">
          <h2 id="h-estou" className="text-xl">Turmas em que estou</h2>
          <ul className="space-y-3">
            {joined.map((c) => (
              <li key={c.id}>
                <ListRow href={`/turmas/${c.id}`} title={c.name} meta={`${c.subject?.name ?? "Matéria"} · com ${c.owner.name}`} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {owned.length > 0 && (
        <section aria-labelledby="h-minhas" className="space-y-3">
          <h2 id="h-minhas" className="text-xl">Turmas que eu criei</h2>
          <ul className="space-y-3">
            {owned.map((c) => (
              <li key={c.id}>
                <ListRow
                  href={`/turmas/${c.id}`}
                  title={c.name}
                  meta={`${c.subject?.name ?? "Matéria"} · ${c.members_count === 1 ? "1 aluno" : `${c.members_count} alunos`}`}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="h-criar" className="space-y-3">
        <h2 id="h-criar" className="text-xl">Sou professor</h2>
        {can_create ? (
          <Card tone="raised">
            <CreateClassroomForm subjects={subjects} />
          </Card>
        ) : (
          <ListRow
            href="/planos"
            leading={<Lock className="size-5" aria-hidden="true" />}
            title="Criar uma turma"
            meta="Do plano Pro. Entrar continua grátis."
          />
        )}
      </section>
    </div>
  );
}
