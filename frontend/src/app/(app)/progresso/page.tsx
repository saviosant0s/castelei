import type { Metadata } from "next";
import { Flame, Lock, Star } from "lucide-react";
import { BadgeIcon } from "@/components/BadgeIcon";
import { EvolutionChart } from "@/components/EvolutionChart";
import { Card, EmptyState, ProgressBar } from "@/components/ui";
import { serverGet } from "@/lib/backend";
import { formatNumber, formatSeconds, weekdayInitial } from "@/lib/format";
import type { ProgressResponse } from "@/lib/types";

export const metadata: Metadata = { title: "Progresso" };

/** O tópico ganha um rótulo em palavras, não só uma cor: cor sozinha exclui. */
function status(accuracy: number) {
  if (accuracy >= 80) return { label: "Dominado", chip: "bg-sage-soft", bar: "sage" as const };
  if (accuracy < 50) return { label: "Revisar", chip: "bg-coral-soft", bar: "coral" as const };
  return { label: "Evoluindo", chip: "bg-sky-soft", bar: "sky" as const };
}

export default async function Progresso() {
  const progress = await serverGet<ProgressResponse>("/progress");
  const { overall, topics } = progress;
  const g = progress.gamification;

  if (overall.attempts === 0) {
    return (
      <EmptyState
        title="Progresso"
        description="Assim que você terminar sua primeira prática, aqui aparecem seu acerto e seu tempo por tópico."
        action={{ label: "Fazer minha primeira lição", href: "/inicio" }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl">Progresso</h1>

      <EvolutionChart points={progress.evolution} />

      {g && (
        <>
          <Card tone="coral" size="lg" radius="panel" aria-labelledby="streak">
            <h2 id="streak" className="label-mono">Streak</h2>
            <div className="mt-3 flex items-end justify-between gap-3">
              <p className="font-mono text-4xl font-medium">
                {g.streak.current}
                <span className="ml-2 font-sans text-base font-normal text-content-secondary">
                  {g.streak.current === 1 ? "dia seguido" : "dias seguidos"}
                </span>
              </p>
              <p className="text-sm text-content-secondary">
                Melhor: {g.streak.longest} {g.streak.longest === 1 ? "dia" : "dias"}
              </p>
            </div>
            <ol className="mt-5 grid grid-cols-7 gap-2" aria-label="Últimos 7 dias">
              {g.week.map((day, i) => (
                <li key={day.date} className="flex flex-col items-center gap-1.5">
                  <span
                    className={`grid size-9 place-items-center rounded-pill ${
                      day.studied ? "bg-coral text-ink" : "border-2 border-ink/20"
                    } ${i === 6 ? "ring-2 ring-ink/40 ring-offset-2 ring-offset-coral-soft" : ""}`}
                  >
                    {day.studied && <Flame className="size-4" aria-hidden="true" />}
                    <span className="sr-only">{day.studied ? "estudou" : "não estudou"}</span>
                  </span>
                  <span className="font-mono text-sm text-content-secondary">{weekdayInitial(day.date)}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm text-content-secondary">
              Streak é a quantidade de dias seguidos em que você respondeu pelo menos uma questão.
            </p>
          </Card>

          <Card size="lg" radius="panel" aria-labelledby="xp">
            <h2 id="xp" className="label-mono">Pontos de experiência (XP)</h2>
            <p className="mt-3 flex items-center gap-2 font-mono text-4xl font-medium">
              <Star className="size-7 text-coral" aria-hidden="true" /> {formatNumber(g.xp_total)}
            </p>
            <p className="mt-3 text-sm text-content-secondary">Você ganha 20 XP a cada resposta certa.</p>
          </Card>

          <section aria-labelledby="conquistas">
            <h2 id="conquistas" className="text-2xl">
              Conquistas · {g.badges.filter((b) => b.earned).length} de {g.badges.length}
            </h2>
            <ul className="mt-4 grid grid-cols-2 gap-3">
              {g.badges.map((badge) => (
                <li key={badge.key}>
                  <Card tone={badge.earned ? "sage" : "sunken"} size="sm" className={badge.earned ? "border-2 border-sage" : "border-2 border-dashed border-ink/15"}>
                    <span
                      className={`grid size-11 place-items-center rounded-pill ${
                        badge.earned ? "bg-sage text-ink" : "bg-ink/10 text-ink/50"
                      }`}
                    >
                      {badge.earned ? <BadgeIcon badgeKey={badge.key} /> : <Lock className="size-5" aria-hidden="true" />}
                    </span>
                    <p className={`mt-3 text-base font-bold ${badge.earned ? "" : "text-content-subtle"}`}>{badge.name}</p>
                    <p className="mt-0.5 text-sm text-content-secondary">{badge.description}</p>
                    <span className="sr-only">{badge.earned ? "Conquistada" : "Ainda bloqueada"}</span>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <dl className="grid grid-cols-3 gap-3">
        {[
          { label: "Respondidas", value: String(overall.answered) },
          { label: "Acerto", value: overall.accuracy !== null ? `${overall.accuracy}%` : "—" },
          { label: "Tempo médio", value: overall.avg_seconds !== null ? formatSeconds(overall.avg_seconds) : "—" },
        ].map((item) => (
          <Card key={item.label} size="sm" className="min-w-0">
            <dt className="text-sm text-content-subtle">{item.label}</dt>
            <dd className="mt-1 font-mono text-2xl font-medium">{item.value}</dd>
          </Card>
        ))}
      </dl>

      <section aria-labelledby="topicos">
        <h2 id="topicos" className="text-2xl">Por tópico</h2>
        <p className="mt-1 text-base text-content-secondary">Os que mais precisam de atenção aparecem primeiro.</p>
        <ul className="mt-4 space-y-3">
          {topics.map((topic) => {
            const s = status(topic.accuracy);
            return (
              <li key={`${topic.lesson_title}-${topic.topic}`}>
                <Card size="sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-bold">{topic.topic}</p>
                      <p className="text-sm text-content-subtle">{topic.lesson_title}</p>
                    </div>
                    <span className={`shrink-0 rounded-pill px-3 py-1 text-sm font-bold ${s.chip}`}>{s.label}</span>
                  </div>
                  <ProgressBar
                    percent={topic.accuracy}
                    tone={s.bar}
                    size="sm"
                    label={`Acerto em ${topic.topic}`}
                    className="mt-3"
                  />
                  <p className="mt-2 font-mono text-sm text-content-secondary">
                    {topic.correct}/{topic.answered} certas · {formatSeconds(topic.avg_seconds)} por questão
                  </p>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
