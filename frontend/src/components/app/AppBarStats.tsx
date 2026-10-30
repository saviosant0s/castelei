"use client";

import Link from "next/link";
import { animate, motion, useAnimate, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { Flame, Star } from "lucide-react";
import { useLayoutEffect } from "react";
import { GoalRing } from "./GoalRing";
import { formatNumber } from "@/lib/format";
import { lembrado, lembrar } from "@/lib/remembered";
import type { AppBarResponse } from "@/lib/types";

type Gami = NonNullable<AppBarResponse["gamification"]>;

/*
| Os números do cabeçalho, vivos: o XP sobe contando quando a pessoa volta de
| uma lição, a chama acende com um pulo na primeira lição do dia, e o anel da
| meta enche. Cada um compara com o último valor que a aba mostrou.
*/
export function AppBarStats({ gami }: { gami: Gami }) {
  const reduzir = useReducedMotion();
  const acesa = gami.streak > 0 && gami.studied_today;
  const xp = useMotionValue(gami.xp);
  const xpTexto = useTransform(xp, (v) => formatNumber(Math.round(v)));
  const [chama, animarChama] = useAnimate();

  useLayoutEffect(() => {
    const antes = lembrado("xp");
    lembrar("xp", gami.xp);
    if (reduzir || antes === null || antes >= gami.xp) return;
    xp.set(antes);
    const c = animate(xp, gami.xp, { duration: 1.1, delay: 0.25, ease: "easeOut" });
    return () => c.stop();
  }, [gami.xp, reduzir, xp]);

  useLayoutEffect(() => {
    const antes = lembrado("acesa");
    lembrar("acesa", acesa ? 1 : 0);
    if (!reduzir && antes === 0 && acesa && chama.current) {
      animarChama(chama.current, { scale: [1, 1.25, 0.95, 1] }, { duration: 0.6 });
    }
  }, [acesa, reduzir, chama, animarChama]);

  const dias = `${gami.streak} ${gami.streak === 1 ? "dia seguido" : "dias seguidos"}${acesa ? "" : ", ainda não estudou hoje"}`;

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <span
        ref={chama}
        className={`inline-flex h-9 items-center gap-1.5 rounded-pill px-3 font-display text-base font-bold ${
          acesa ? "bg-coral-soft text-coral-deep" : "bg-surface-sunken text-content-subtle"
        }`}
        aria-label={dias}
      >
        <Flame className={`size-[1.1rem] ${acesa ? "fill-coral text-coral" : ""}`} aria-hidden="true" />
        {gami.streak}
      </span>
      <span
        className="inline-flex h-9 items-center gap-1.5 rounded-pill bg-gold-soft px-3 font-display text-base font-bold tabular-nums text-gold"
        aria-label={`${gami.xp} pontos de experiência`}
      >
        <Star className="size-[1.1rem] fill-current" aria-hidden="true" />
        <motion.span>{xpTexto}</motion.span>
      </span>
      <Link href="/perfil#meta" className="grid size-9 place-items-center" aria-label={`Meta do dia: ${gami.goal.today} de ${gami.goal.target} XP`}>
        <GoalRing today={gami.goal.today} target={gami.goal.target} size={30} />
      </Link>
    </div>
  );
}
