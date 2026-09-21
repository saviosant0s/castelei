import type { Metadata } from "next";
import { Flame, Lock, Star } from "lucide-react";
import { BadgeIcon } from "@/components/BadgeIcon";
import { Card, Callout, EmptyState } from "@/components/ui";
import { serverGet } from "@/lib/backend";
import { formatNumber, weekdayInitial } from "@/lib/format";
import type { ProgressResponse } from "@/lib/types";

export const metadata: Metadata = { title: "Conquistas" };

export default async function Conquistas() {
  const progress = await serverGet<ProgressResponse>("/progress");
  const g = progress.gamification;

  if (!g) {
    return (
      <Callout role="bloqueado" icon={Lock} href="/planos">
        Streak, XP e conquistas fazem parte dos planos pagos.
      </Callout>
    );
  }

  if (progress.overall.attempts === 0) {
    return (
      <EmptyState
        level="h2"
        title="Nenhuma conquista ainda"
        description="As conquistas vão aparecendo conforme você pratica: a primeira lição, o primeiro dia seguido, a primeira nota cheia."
        action={{ label: "Fazer minha primeira lição", href: "/inicio" }}
      />
    );
  }

  const earned = g.badges.filter((b) => b.earned).length;

  return (
    <div className="space-y-8">
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
                  day.studied ? "bg-coral text-on-accent" : "border-2 border-ink/20"
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

      <section aria-labelledby="medalhas">
        <h2 id="medalhas" className="text-2xl">
          Medalhas · {earned} de {g.badges.length}
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-3">
          {g.badges.map((badge) => (
            <li key={badge.key}>
              <Card
                tone={badge.earned ? "sage" : "sunken"}
                size="sm"
                className={badge.earned ? "border-2 border-sage" : "border-2 border-dashed border-ink/15"}
              >
                <span
                  className={`grid size-11 place-items-center rounded-pill ${
                    badge.earned ? "bg-sage text-on-accent" : "bg-ink/10 text-ink/50"
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
    </div>
  );
}
