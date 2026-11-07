import type { Metadata } from "next";
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
        O professor cria a turma de uma matéria e acompanha quem já estudou e onde a turma erra.
      </PageHero>

      <section aria-labelledby="h-entrar" className="space-y-3">
        <h2 id="h-entrar" className="text-2xl">Entrar numa turma</h2>
        <p className="text-base text-content-secondary">Digite o código que o professor passou.</p>
        <JoinByCode />
      </section>

      {joined.length > 0 && (
        <section aria-labelledby="h-estou" className="space-y-3">
          <h2 id="h-estou" className="text-2xl">Turmas em que estou</h2>
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
          <h2 id="h-minhas" className="text-2xl">Turmas que eu criei</h2>
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
        <h2 id="h-criar" className="text-2xl">Criar uma turma</h2>
        {can_create ? (
          <Card tone="raised">
            <CreateClassroomForm subjects={subjects} />
          </Card>
        ) : (
          <Card tone="sky" href="/planos">
            <p className="text-base">
              <strong>Criar e acompanhar turma é do plano Pro.</strong> Entrar numa turma continua grátis para os alunos.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}
