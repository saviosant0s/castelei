import type { Metadata } from "next";
import Link from "next/link";
import { serverGet } from "@/lib/backend";
import { Flame, Lock, Star } from "lucide-react";
import { BadgeIcon } from "@/components/BadgeIcon";
import { EvolutionChart } from "@/components/EvolutionChart";
import { formatNumber, formatSeconds, weekdayInitial } from "@/lib/format";
import type { ProgressResponse } from "@/lib/types";

export const metadata: Metadata = { title: "Progresso" };

function status(accuracy: number) {
  if (accuracy >= 80) return { label: "Dominado", classes: "bg-sage-soft text-ink", bar: "bg-sage" };
  if (accuracy < 50) return { label: "Revisar", classes: "bg-coral-soft text-ink", bar: "bg-coral" };
  return { label: "Evoluindo", classes: "bg-sky-soft text-ink", bar: "bg-sky" };
}

export default async function Progresso() {
  const progress = await serverGet<ProgressResponse>("/progress");
  const { overall, topics } = progress;
  const g = progress.gamification;

  if (overall.attempts === 0) {
    return (
      <div className="space-y-5 pt-6">
        <h1 className="text-4xl">Progresso</h1>
        <p className="text-base text-ink/70">
          Assim que você terminar sua primeira prática, aqui aparecem seu acerto e seu tempo por tópico.
        </p>
        <Link href="/inicio" className="btn btn-primary">Fazer minha primeira lição</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl">Progresso</h1>

      <EvolutionChart points={progress.evolution} />

      {g && (
        <>
          <section aria-labelledby="streak" className="rounded-3xl bg-coral-soft p-6">
            <h2 id="streak" className="label-mono">Streak</h2>
            <div className="mt-3 flex items-end justify-between gap-3">
              <p className="font-mono text-4xl font-medium">
                {g.streak.current}
                <span className="ml-2 font-sans text-base font-normal text-ink/70">
                  {g.streak.current === 1 ? "dia seguido" : "dias seguidos"}
                </span>
              </p>
              <p className="text-sm text-ink/70">
                Melhor: {g.streak.longest} {g.streak.longest === 1 ? "dia" : "dias"}
              </p>
            </div>
            <ol className="mt-5 grid grid-cols-7 gap-2" aria-label="Últimos 7 dias">
              {g.week.map((day, i) => (
                <li key={day.date} className="flex flex-col items-center gap-1.5">
                  <span
                    className={`grid size-9 place-items-center rounded-full ${
                      day.studied ? "bg-coral text-ink" : "border-2 border-ink/20"
                    } ${i === 6 ? "ring-2 ring-ink/40 ring-offset-2 ring-offset-coral-soft" : ""}`}
                  >
                    {day.studied && <Flame className="size-4" aria-hidden="true" />}
                    <span className="sr-only">{day.studied ? "estudou" : "não estudou"}</span>
                  </span>
                  <span className="font-mono text-sm text-ink/70">{weekdayInitial(day.date)}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm text-ink/70">
              Streak é a quantidade de dias seguidos em que você respondeu pelo menos uma questão.
            </p>
          </section>

          <section aria-labelledby="xp" className="rounded-3xl bg-white p-6 shadow-lift">
            <h2 id="xp" className="label-mono">Pontos de experiência (XP)</h2>
            <p className="mt-3 flex items-center gap-2 font-mono text-4xl font-medium">
              <Star className="size-7 text-coral" aria-hidden="true" /> {formatNumber(g.xp_total)}
            </p>
            <p className="mt-3 text-sm text-ink/70">Você ganha 20 XP a cada resposta certa.</p>
          </section>

          <section aria-labelledby="conquistas">
            <h2 id="conquistas" className="text-2xl">
              Conquistas · {g.badges.filter((b) => b.earned).length} de {g.badges.length}
            </h2>
            <ul className="mt-4 grid grid-cols-2 gap-3">
              {g.badges.map((badge) => (
                <li
                  key={badge.key}
                  className={`rounded-2xl p-4 ${
                    badge.earned ? "border-2 border-sage bg-sage-soft" : "border-2 border-dashed border-ink/15 bg-paper-2"
                  }`}
                >
                  <span className={`grid size-11 place-items-center rounded-full ${badge.earned ? "bg-sage text-ink" : "bg-ink/10 text-ink/50"}`}>
                    {badge.earned ? <BadgeIcon badgeKey={badge.key} /> : <Lock className="size-5" aria-hidden="true" />}
                  </span>
                  <p className={`mt-3 text-base font-bold ${badge.earned ? "" : "text-ink/60"}`}>{badge.name}</p>
                  <p className="mt-0.5 text-sm text-ink/70">{badge.description}</p>
                  <span className="sr-only">{badge.earned ? "Conquistada" : "Ainda bloqueada"}</span>
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
          <div key={item.label} className="rounded-2xl bg-white p-4 shadow-lift">
            <dt className="text-sm text-ink/60">{item.label}</dt>
            <dd className="mt-1 font-mono text-2xl font-medium">{item.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="topicos">
        <h2 id="topicos" className="text-2xl">Por tópico</h2>
        <p className="mt-1 text-base text-ink/70">Os que mais precisam de atenção aparecem primeiro.</p>
        <ul className="mt-4 space-y-3">
          {topics.map((topic) => {
            const s = status(topic.accuracy);
            return (
              <li key={`${topic.lesson_title}-${topic.topic}`} className="rounded-2xl bg-white p-4 shadow-lift">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-bold">{topic.topic}</p>
                    <p className="text-sm text-ink/60">{topic.lesson_title}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${s.classes}`}>{s.label}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10" role="img" aria-label={`Acerto de ${topic.accuracy}%`}>
                  <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${topic.accuracy}%` }} />
                </div>
                <p className="mt-2 font-mono text-sm text-ink/70">
                  {topic.correct}/{topic.answered} certas · {formatSeconds(topic.avg_seconds)} por questão
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
