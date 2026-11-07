import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHero, ProgressBar } from "@/components/ui";
import { DeleteClassroomButton, LeaveButton, RemoveMemberButton } from "@/components/classroom/ClassroomActions";
import { InviteBox } from "@/components/classroom/InviteBox";
import { serverGet } from "@/lib/backend";
import { licoesMaisFracas, precisamDeAtencao, ultimaVez, type ClassroomDetail } from "@/lib/classrooms";

export const metadata: Metadata = { title: "Turma" };

/*
| A turma. O aluno vê de quem é e a matéria; o dono vê o desempenho.
|
| A tela do dono responde a três perguntas, nesta ordem: quem está parado,
| onde a turma erra e como cada um está. Os números saem da ÚLTIMA resposta de
| cada questão, como no Progresso: é o que o aluno sabe hoje.
*/
export default async function TurmaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await serverGet<ClassroomDetail>(`/classrooms/${Number(id)}`);
  const { classroom } = data;
  const materia = classroom.subject;

  if (!classroom.is_owner) {
    return (
      <div className="space-y-6">
        <PageHero eyebrow={`Turma de ${classroom.owner.name}`} title={classroom.name}>
          {materia?.name}
        </PageHero>
        <p className="text-base text-content-secondary">
          {classroom.owner.name} acompanha o seu progresso em {materia?.name ?? "nesta matéria"}: quantas lições você praticou, o seu acerto e
          quando estudou pela última vez.
        </p>
        {materia && (
          <Link href={`/materia/${materia.slug}`} className="btn btn-primary w-full">
            Estudar {materia.name}
          </Link>
        )}
        <LeaveButton classroomId={classroom.id} />
      </div>
    );
  }

  const members = data.members ?? [];
  const lessons = data.lessons ?? [];
  const parados = precisamDeAtencao(members);
  const fracas = licoesMaisFracas(lessons);

  return (
    <div className="space-y-8">
      <PageHero eyebrow={materia?.name ?? "Turma"} title={classroom.name}>
        {members.length === 1 ? "1 aluno" : `${members.length} alunos`}
      </PageHero>

      <Card tone="raised">
        <InviteBox code={classroom.code ?? ""} />
      </Card>

      {members.length === 0 ? (
        <Card tone="dashed">
          <p className="text-base">
            Ninguém entrou ainda. Passe o código em sala ou mande o convite no grupo da turma. Quem entrar aparece aqui.
          </p>
        </Card>
      ) : (
        <>
          <section aria-labelledby="h-parados" className="space-y-3">
            <h2 id="h-parados" className="text-2xl">Quem precisa de um empurrão</h2>
            {parados.length === 0 ? (
              <p className="text-base text-content-secondary">Todo mundo estudou nesta semana.</p>
            ) : (
              <ul className="space-y-2">
                {parados.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 rounded-card bg-coral-soft px-4 py-3">
                    <span className="min-w-0 truncate font-bold">{m.name}</span>
                    <span className="shrink-0 text-sm">{ultimaVez(m.days_inactive)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="h-erra" className="space-y-3">
            <h2 id="h-erra" className="text-2xl">Onde a turma erra</h2>
            {fracas.length === 0 ? (
              <p className="text-base text-content-secondary">Assim que a turma praticar, as lições mais difíceis aparecem aqui.</p>
            ) : (
              <ul className="space-y-3">
                {fracas.map((l) => (
                  <li key={l.id} className="rounded-card bg-surface-raised px-4 py-3 shadow-lift">
                    <Link href={`/licao/${l.id}`} className="font-bold underline-offset-4 hover:underline">
                      {l.title}
                    </Link>
                    <p className="mt-1 text-sm text-content-subtle">
                      {l.accuracy}% de acerto · {l.practiced === 1 ? "1 aluno praticou" : `${l.practiced} alunos praticaram`}
                    </p>
                    <div className="mt-2">
                      <ProgressBar percent={l.accuracy} tone={l.accuracy < 60 ? "coral" : "sage"} label={`Acerto da turma em ${l.title}`} size="sm" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="h-alunos" className="space-y-3">
            <h2 id="h-alunos" className="text-2xl">Alunos</h2>
            <ul className="space-y-3">
              {members.map((m) => (
                <li key={m.id} className="rounded-card bg-surface-raised px-4 py-3 shadow-lift">
                  {/* flex-wrap: a confirmação de "Tirar" desce para a linha de baixo em vez de espremer o nome. */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{m.name}</p>
                      <p className="text-sm text-content-subtle">
                        {m.practiced} de {m.total_lessons} lições · {m.accuracy === null ? "sem acerto ainda" : `${m.accuracy}% de acerto`} ·{" "}
                        {ultimaVez(m.days_inactive)}
                      </p>
                    </div>
                    <RemoveMemberButton classroomId={classroom.id} userId={m.id} name={m.name} />
                  </div>
                  <div className="mt-2">
                    <ProgressBar
                      percent={m.total_lessons > 0 ? Math.round((100 * m.practiced) / m.total_lessons) : 0}
                      tone="sky"
                      label={`Lições praticadas por ${m.name}`}
                      size="sm"
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <DeleteClassroomButton classroomId={classroom.id} />
    </div>
  );
}
