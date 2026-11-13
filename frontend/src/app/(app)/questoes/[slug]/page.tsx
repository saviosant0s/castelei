import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { PageHero } from "@/components/ui";
import { serverGet } from "@/lib/backend";
import { pluralize } from "@/lib/format";
import { niveisDaLicao, porModulo } from "@/lib/question-bank";
import { DIFFICULTY_LABEL, type SubjectsResponse } from "@/lib/types";

export const metadata: Metadata = { title: "Questões" };

/*
| As lições de uma matéria, cada uma com o que dá para treinar: as questões
| da lição e, no Pro, cada nível à parte. Para o grátis os níveis aparecem
| trancados, com UM aviso no topo: esconder fingiria que a lição não tem mais
| nada, e repetir o aviso em cada lição seria uma parede de cadeados.
*/
export default async function QuestoesDaMateria({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { subjects, can_use_levels: podeNivel = false } = await serverGet<SubjectsResponse>("/subjects");
  const subject = subjects.find((s) => s.slug === slug);
  if (!subject || subject.exam?.writing) notFound();

  const temNivel = subject.lessons.some((l) => niveisDaLicao(l).length > 0);
  const chip = "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold";

  return (
    <div className="space-y-7">
      <PageHero title={subject.name}>Escolha a lição{temNivel ? " e o nível" : ""}.</PageHero>

      {temNivel && !podeNivel && (
        <p className="rounded-card bg-sky-soft px-4 py-3 text-base">
          Escolher o nível (fácil, média ou difícil) é do plano Pro. As questões de cada lição continuam abertas.{" "}
          <Link href="/planos" className="font-bold underline underline-offset-4">
            Ver planos
          </Link>
        </p>
      )}

      {porModulo(subject.lessons).map((bloco, i) => (
        <section key={`${bloco.module ?? "sem"}-${i}`} aria-label={bloco.module ?? subject.name} className="space-y-3">
          {bloco.module && <h2 className="label-mono px-1">{bloco.module}</h2>}
          <ul className="space-y-3">
            {bloco.lessons.map((lesson) => {
              const niveis = niveisDaLicao(lesson);
              return (
                <li key={lesson.id} className="rounded-card bg-surface-raised p-4 shadow-lift">
                  <p className="font-display text-base leading-snug font-bold">
                    <span className="text-content-subtle tabular-nums">{lesson.position}. </span>
                    {lesson.title}
                  </p>
                  {lesson.locked ? (
                    <p className="mt-2 flex items-center gap-2 text-sm text-content-secondary">
                      <Lock className="size-4 shrink-0" aria-hidden="true" />
                      <span>
                        Abre depois da anterior.{" "}
                        <Link href={`/licao/${lesson.id}`} className="font-bold underline underline-offset-4">
                          Ver por quê
                        </Link>
                      </span>
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {lesson.questions_total > 0 && (
                        <Link href={`/licao/${lesson.id}/praticar`} className={`${chip} w-full justify-center bg-sky text-on-accent`}>
                          Praticar {pluralize(lesson.questions_available, "questão", "questões")}
                        </Link>
                      )}
                      {/* Os níveis numa fileira de três, do mesmo tamanho: soltos, o "Difícil" caía sozinho na linha de baixo. */}
                      {niveis.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {niveis.map(({ nivel, total }) =>
                            podeNivel ? (
                              <Link
                                key={nivel}
                                href={`/licao/${lesson.id}/praticar?nivel=${nivel}`}
                                aria-label={`${DIFFICULTY_LABEL[nivel]}: ${pluralize(total, "questão", "questões")}`}
                                className={`${chip} justify-center border-2 border-ink/15 px-2 hover:bg-ink/5`}
                              >
                                {DIFFICULTY_LABEL[nivel]}
                                <span className="font-mono text-content-subtle">{total}</span>
                              </Link>
                            ) : (
                              <span key={nivel} className={`${chip} justify-center border-2 border-ink/10 px-2 text-content-subtle`}>
                                <Lock className="size-4" aria-hidden="true" />
                                {DIFFICULTY_LABEL[nivel]}
                              </span>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
