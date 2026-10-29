import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ArrowDownRight, ChevronDown, ChevronRight, CircleHelp, Minus } from "lucide-react";
import { Card, EmptyState, ProgressBar } from "@/components/ui";
import { AccuracyRing } from "@/components/stats/AccuracyRing";
import { MapLegend, SubjectMapGrid } from "@/components/stats/SubjectMap";
import { Retention } from "@/components/stats/Retention";
import { WeekBars } from "@/components/stats/WeekBars";
import { serverGet } from "@/lib/backend";
import { formatSeconds, pluralize } from "@/lib/format";
import { agruparPorLicao, nivel } from "@/lib/progress-groups";
import { comoEstou, readiness } from "@/lib/stats";
import type { ProgressResponse, StatsResponse } from "@/lib/types";

export const metadata: Metadata = { title: "Progresso" };

/** O nível ganha um rótulo em palavras, não só uma cor: cor sozinha exclui. */
const niveis = {
  dominado: { label: "Dominado", chip: "bg-sage-soft", bar: "sage" as const },
  evoluindo: { label: "Evoluindo", chip: "bg-sky-soft", bar: "sky" as const },
  revisar: { label: "Revisar", chip: "bg-coral-soft", bar: "coral" as const },
};

/*
| O Resumo do Progresso é para BATER O OLHO.
|
| Queixa do Sávio: a tela explicava antes de mostrar — legenda em duas
| linhas, parágrafo em cada seção e uma lista com todas as lições. "A pessoa
| quer ver se está bem ou mal, se evoluiu ou não." Então, nesta ordem: um
| número grande com a tendência da semana, três números de apoio, o gráfico
| da semana, uma barra por matéria e as lições mais fracas. Toda explicação
| foi para trás de um "?" ou de um toque que abre; nada sumiu.
*/
export default async function Resumo() {
  const [{ overall, topics }, stats] = await Promise.all([
    serverGet<ProgressResponse>("/progress"),
    serverGet<StatsResponse>("/progress/stats"),
  ]);

  if (overall.attempts === 0) {
    return (
      <EmptyState
        level="h2"
        art="progresso"
        title="Ainda não há números"
        description="Assim que você terminar sua primeira prática, aqui aparecem seu acerto e seu tempo por tópico."
        action={{ label: "Fazer minha primeira lição", href: "/inicio" }}
      />
    );
  }

  const licoes = agruparPorLicao(topics);
  const dominadas = stats.subjects.reduce((n, s) => n + s.lessons_mastered, 0);
  const semana = stats.week;
  const naSemana = semana.days.reduce((n, d) => n + d.answered, 0);

  return (
    <div className="space-y-4">
      {/* 1. Estou bem ou mal? E estou melhorando? */}
      {overall.accuracy !== null && (
        <Card radius="panel" className="relative flex items-center gap-4">
          <AccuracyRing value={overall.accuracy} />
          <div className="min-w-0">
            <p className="font-display text-xl font-bold">{comoEstou(overall.accuracy)}</p>
            <p className="text-sm text-content-subtle">de acerto nas questões</p>
            <Tendencia change={semana.change} />
          </div>
          <details className="group absolute top-3 right-3">
            <summary
              className="grid size-8 cursor-pointer list-none place-items-center rounded-pill bg-surface-sunken text-content-subtle [&::-webkit-details-marker]:hidden"
              aria-label="Como estes números são contados"
            >
              <CircleHelp className="size-4" aria-hidden="true" />
            </summary>
            <div className="absolute top-10 right-0 z-10 w-72 rounded-card bg-surface-raised p-4 text-sm text-content-secondary shadow-lift">
              O acerto conta todas as questões que você já respondeu (a parte escrita fica de fora, porque não tem certo nem errado). A seta
              compara os últimos 7 dias com os 7 anteriores. Uma lição está dominada quando a sua última resposta acerta 80% dela.
            </div>
          </details>
        </Card>
      )}

      {/* 2. Os números de apoio, numa faixa. */}
      <dl className="grid grid-cols-3 gap-2.5">
        {[
          { label: "respondidas", value: String(overall.answered) },
          { label: pluralize(dominadas, "dominada", "dominadas").replace(/^\d+ /, ""), value: String(dominadas) },
          { label: "por questão", value: overall.avg_seconds !== null ? formatSeconds(overall.avg_seconds) : "—" },
        ].map((item) => (
          <div key={item.label} className="rounded-card bg-surface-raised px-2 py-3 text-center shadow-lift">
            <dd className="font-display text-2xl font-bold tabular-nums">{item.value}</dd>
            <dt className="text-sm text-content-subtle">{item.label}</dt>
          </div>
        ))}
      </dl>

      {/* 3. Esta semana. */}
      <Card radius="panel">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg">Esta semana</h2>
          <Link href="/progresso/evolucao" className="inline-flex items-center text-sm font-bold text-label">
            Evolução <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <WeekBars days={semana.days} />
        <p className="mt-2 text-center text-sm text-content-subtle">
          {naSemana > 0 ? `${pluralize(naSemana, "questão", "questões")} nos últimos 7 dias` : "Nenhuma questão nos últimos 7 dias"}
        </p>
      </Card>

      {/* 4. Por matéria: uma barra cada, e o mapa de lições abre num toque. */}
      {stats.subjects.length > 0 && (
        <Card radius="panel">
          <h2 className="text-lg">Por matéria</h2>
          <ul className="mt-2 divide-y divide-ink/10">
            {stats.subjects.map((subject) => {
              const pct = subject.lessons_total > 0 ? Math.round((subject.lessons_mastered / subject.lessons_total) * 100) : 0;
              return (
                <li key={subject.id}>
                  <details className="group py-3">
                    <summary className="block cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="min-w-0 truncate text-base font-bold">{subject.name}</span>
                        <span className="font-display text-lg font-bold tabular-nums">{pct}%</span>
                      </span>
                      <ProgressBar percent={pct} tone="sage" size="sm" label={`${subject.name}: ${pct}% dominada`} className="mt-1.5" />
                      <span className="mt-1.5 flex items-center justify-between gap-3 text-sm text-content-subtle">
                        <span>
                          {subject.lessons_mastered} de {subject.lessons_total} dominadas
                          {subject.days_to_exam !== null && ` · prova em ${pluralize(subject.days_to_exam, "dia", "dias")}`}
                        </span>
                        <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
                      </span>
                    </summary>
                    <div className="mt-3 space-y-3">
                      <p className="text-sm text-content-secondary">{readiness(subject)}</p>
                      <SubjectMapGrid subject={subject} />
                      <MapLegend />
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* 5. Onde eu erro: as mais fracas, num toque de refazer. */}
      {stats.weak_lessons.length > 0 && (
        <Card radius="panel">
          <h2 className="text-lg">Onde eu erro</h2>
          <ul className="-mx-5 mt-3 flex snap-x gap-2.5 overflow-x-auto px-5 pb-1">
            {stats.weak_lessons.map((l) => (
              <li key={l.lesson_id} className="w-40 shrink-0 snap-start">
                <Link
                  href={`/licao/${l.lesson_id}/praticar?erradas=1`}
                  className="flex h-full flex-col rounded-card bg-surface-sunken p-3"
                  aria-label={`${l.lesson_title}: ${l.accuracy}% de acerto. Refazer as erradas`}
                >
                  <span className="font-display text-2xl font-bold text-coral-deep">{l.accuracy}%</span>
                  <span className="mt-0.5 line-clamp-2 text-sm font-bold text-balance">{l.lesson_title}</span>
                  <span className="mt-auto pt-2 text-xs font-bold text-label">Refazer as erradas</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* 6. O resto dos números, recolhido: quem quer o detalhe abre. */}
      <details className="group rounded-panel bg-surface-raised shadow-lift">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden">
          <span className="font-display text-lg font-bold">Memória e todas as lições</span>
          <ChevronDown className="size-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="space-y-6 px-5 pb-5">
          <section aria-labelledby="esquecendo" className="space-y-3">
            <h3 id="esquecendo" className="text-base">O que estou esquecendo</h3>
            <Retention retention={stats.retention} />
          </section>

          <section aria-labelledby="licoes" className="space-y-3">
            <h3 id="licoes" className="text-base">Todas as lições</h3>
            <ul className="space-y-2">
              {licoes.map((licao) => {
                const n = niveis[nivel(licao.accuracy)];
                return (
                  <li key={licao.lesson_id}>
                    <Link href={`/licao/${licao.lesson_id}`} className="block rounded-card bg-surface-sunken p-3">
                      <span className="flex items-start justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-balance">{licao.lesson_title}</span>
                          <span className="block text-xs text-content-subtle">{licao.subject_name}</span>
                        </span>
                        <span className={`shrink-0 rounded-pill px-2.5 py-0.5 text-xs font-bold ${n.chip}`}>{n.label}</span>
                      </span>
                      <ProgressBar percent={licao.accuracy} tone={n.bar} size="sm" label={`Acerto em ${licao.lesson_title}`} className="mt-2" />
                      <span className="mt-1.5 flex items-center justify-between text-xs text-content-subtle">
                        <span>
                          {licao.accuracy}% · {licao.correct}/{licao.answered} {licao.writing ? "cumpridas" : "certas"}
                        </span>
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </details>
    </div>
  );
}

/** A seta da semana: só aparece com respostas suficientes nas duas semanas. */
function Tendencia({ change }: { change: number | null }) {
  if (change === null) return <p className="mt-2 text-sm text-content-subtle">Continue praticando para ver a tendência.</p>;

  const t =
    change >= 3
      ? { icon: ArrowUpRight, chip: "bg-sage-soft text-sage-deep", texto: `${change} pontos na semana` }
      : change <= -3
        ? { icon: ArrowDownRight, chip: "bg-coral-soft text-coral-deep", texto: `${Math.abs(change)} pontos a menos na semana` }
        : { icon: Minus, chip: "bg-surface-sunken text-content-secondary", texto: "Estável na semana" };

  return (
    <span className={`mt-2 inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-sm font-bold whitespace-nowrap ${t.chip}`}>
      <t.icon className="size-4" aria-hidden="true" />
      {t.texto}
    </span>
  );
}
