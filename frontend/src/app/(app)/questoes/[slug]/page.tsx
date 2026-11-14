import { ScrollMemory } from "@/components/app/ScrollMemory";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown, Lock } from "lucide-react";
import { PageHero } from "@/components/ui";
import { serverGet } from "@/lib/backend";
import { pluralize } from "@/lib/format";
import { NIVEIS, RODADA, niveisDaLicao, porModulo } from "@/lib/question-bank";
import { DIFFICULTY_LABEL, type Difficulty, type SubjectsResponse } from "@/lib/types";

// A cor de cada nível, a mesma da etiqueta da questão. Nunca vermelho: vermelho é erro.
const NIVEL_COR: Record<Difficulty, string> = { facil: "bg-sage-soft", media: "bg-sky-soft", dificil: "bg-coral-soft" };

export const metadata: Metadata = { title: "Questões" };

/*
| A matéria na aba Questões. Primeiro a MATÉRIA inteira: uma rodada sorteada
| de todas as lições e, no Pro, cada nível com o total da matéria. Pedido do
| Sávio, novembro de 2026: lição por lição, com "8 questões" e níveis de dois
| em dois, o app parecia ter pouca coisa. A lista por lição continua, mas
| recolhida embaixo, para quem quer treinar um assunto só.
|
| Para o grátis os níveis aparecem trancados, com UM aviso: esconder fingiria
| que a matéria não tem mais nada.
*/
export default async function QuestoesDaMateria({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { subjects, can_use_levels: podeNivel = false } = await serverGet<SubjectsResponse>("/subjects");
  const subject = subjects.find((s) => s.slug === slug);
  if (!subject || subject.exam?.writing) notFound();

  const base = subject.lessons.reduce((soma, l) => soma + l.questions_available, 0);
  const porNivel = NIVEIS.map((nivel) => ({
    nivel,
    total: subject.lessons.reduce((soma, l) => soma + (l.levels?.[nivel] ?? 0), 0),
  })).filter((n) => n.total > 0);
  const total = base + porNivel.reduce((soma, n) => soma + n.total, 0);
  const rodada = Math.min(RODADA, base);
  const chip = "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold";

  return (
    <div className="space-y-7">
      <ScrollMemory id={`questoes:${slug}`} />
      <PageHero title={subject.name}>
        {pluralize(total, "questão", "questões")} em {pluralize(subject.lessons.length, "lição", "lições")}.
      </PageHero>

      {base > 0 && (
        <section aria-labelledby="q-materia" className="rounded-card bg-surface-raised p-5 shadow-lift">
          <h2 id="q-materia" className="text-xl">Treinar a matéria</h2>
          <p className="mt-1 text-base text-content-secondary">
            Sorteadas entre as {base} da matéria. As que você nunca respondeu vêm primeiro.
          </p>
          <Link href={`/questoes/${slug}/praticar`} className="btn btn-primary mt-4 w-full">
            Praticar {pluralize(rodada, "questão", "questões")}
          </Link>
        </section>
      )}

      {porNivel.length > 0 && (
        <section aria-labelledby="q-nivel" className="space-y-3">
          <h2 id="q-nivel" className="label-mono px-1">Por nível</h2>
          {!podeNivel && (
            <p className="rounded-card bg-sky-soft px-4 py-3 text-base">
              Escolher o nível é do plano Pro.{" "}
              <Link href="/planos" className="font-bold underline underline-offset-4">
                Ver planos
              </Link>
            </p>
          )}
          <div className="grid grid-cols-3 gap-3">
            {porNivel.map(({ nivel, total: n }) => {
              const miolo = (
                <>
                  <span className="flex items-center gap-1.5 text-base font-bold">
                    {!podeNivel && <Lock className="size-4" aria-hidden="true" />}
                    {DIFFICULTY_LABEL[nivel]}
                  </span>
                  <span className="font-display text-2xl font-bold tabular-nums">{n}</span>
                  <span className="text-sm text-content-subtle">{n === 1 ? "questão" : "questões"}</span>
                </>
              );
              const caixa = `flex flex-col items-center gap-0.5 rounded-card border-2 px-2 py-4 text-center ${NIVEL_COR[nivel]}`;
              return podeNivel ? (
                <Link key={nivel} href={`/questoes/${slug}/praticar?nivel=${nivel}`} className={`${caixa} border-transparent transition active:translate-y-0.5`}>
                  {miolo}
                </Link>
              ) : (
                <div key={nivel} className={`${caixa} border-transparent opacity-60`}>
                  {miolo}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <details className="group rounded-card bg-surface-raised shadow-lift">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-base font-bold [&::-webkit-details-marker]:hidden">
          Treinar uma lição só
          <ChevronDown className="size-5 shrink-0 text-content-faint transition group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="space-y-6 px-4 pb-4">
      {porModulo(subject.lessons).map((bloco, i) => (
        <section key={`${bloco.module ?? "sem"}-${i}`} aria-label={bloco.module ?? subject.name} className="space-y-3">
          {bloco.module && <h2 className="label-mono px-1">{bloco.module}</h2>}
          <ul className="space-y-3">
            {bloco.lessons.map((lesson) => {
              const niveis = niveisDaLicao(lesson);
              return (
                <li key={lesson.id} className="rounded-card border-2 border-ink/10 p-4">
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
      </details>
    </div>
  );
}
