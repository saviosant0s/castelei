"use client";

import { animate, motion, useAnimate, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { Flame, Star } from "lucide-react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { GoalRing } from "./GoalRing";
import { Balao, PainelChama, PainelMeta, PainelNivel } from "./HeaderPanels";
import { formatNumber } from "@/lib/format";
import { lembrado, lembrar } from "@/lib/remembered";
import type { AppBarResponse } from "@/lib/types";

type Gami = NonNullable<AppBarResponse["gamification"]>;

/*
| Os números do cabeçalho, vivos: o XP sobe contando quando a pessoa volta de
| uma lição, a chama acende com um pulo na primeira lição do dia, e o anel da
| meta enche. Cada um compara com o último valor que a aba mostrou.
|
| Os três são botões: cada um abre o seu balão (a semana, o nível e a meta),
| um aberto por vez.
*/
export function AppBarStats({ gami }: { gami: Gami }) {
  const reduzir = useReducedMotion();
  const acesa = gami.streak > 0 && gami.studied_today;
  const xp = useMotionValue(gami.xp);
  const xpTexto = useTransform(xp, (v) => formatNumber(Math.round(v)));
  const [chama, animarChama] = useAnimate();
  const [aberto, setAberto] = useState<"chama" | "nivel" | "meta" | null>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const fechar = useCallback(() => setAberto(null), []);
  const alternar = (qual: "chama" | "nivel" | "meta") => setAberto((a) => (a === qual ? null : qual));

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
    <div ref={caixa} className="relative flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        ref={chama}
        onClick={() => alternar("chama")}
        aria-expanded={aberto === "chama"}
        className={`inline-flex h-9 items-center gap-1.5 rounded-pill px-3 font-display text-base font-bold ${
          acesa ? "bg-coral-soft text-coral-deep" : "bg-surface-sunken text-content-subtle"
        }`}
        aria-label={dias}
      >
        <Flame className={`size-[1.1rem] ${acesa ? "fill-coral text-coral" : ""}`} aria-hidden="true" />
        {gami.streak}
      </button>
      <button
        type="button"
        onClick={() => alternar("nivel")}
        aria-expanded={aberto === "nivel"}
        className="inline-flex h-9 items-center gap-1.5 rounded-pill bg-gold-soft px-3 font-display text-base font-bold tabular-nums text-gold"
        aria-label={`${gami.xp} pontos de experiência, nível ${gami.level.current}`}
      >
        <Star className="size-[1.1rem] fill-current" aria-hidden="true" />
        <motion.span>{xpTexto}</motion.span>
      </button>
      <button
        type="button"
        onClick={() => alternar("meta")}
        aria-expanded={aberto === "meta"}
        className="grid size-9 place-items-center"
        aria-label={`Meta do dia: ${gami.goal.today} de ${gami.goal.target} XP`}
      >
        <GoalRing today={gami.goal.today} target={gami.goal.target} size={30} />
      </button>

      <Balao aberto={aberto === "chama"} aoFechar={fechar} ancora={caixa} rotulo="Dias seguidos">
        <PainelChama gami={gami} />
      </Balao>
      <Balao aberto={aberto === "nivel"} aoFechar={fechar} ancora={caixa} rotulo="Seu nível">
        <PainelNivel gami={gami} />
      </Balao>
      <Balao aberto={aberto === "meta"} aoFechar={fechar} ancora={caixa} rotulo="Meta do dia">
        <PainelMeta goal={gami.goal} />
      </Balao>
    </div>
  );
}
