"use client";

import { useCallback, useRef, useState } from "react";
import { GoalRing } from "./GoalRing";
import { Balao, PainelMeta } from "./HeaderPanels";
import type { AppBarResponse } from "@/lib/types";

/** O anel grande da tela inicial: tocar abre o mesmo balão da meta do cabeçalho. */
export function HomeGoal({ goal }: { goal: NonNullable<AppBarResponse["gamification"]>["goal"] }) {
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const fechar = useCallback(() => setAberto(false), []);

  return (
    <div ref={caixa} className="relative">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        aria-label={`Meta do dia: ${goal.today} de ${goal.target} XP`}
        className="rounded-full"
      >
        <GoalRing today={goal.today} target={goal.target} size={132} big />
      </button>
      <Balao aberto={aberto} aoFechar={fechar} ancora={caixa} rotulo="Meta do dia" alinhar="center">
        <PainelMeta goal={goal} semAnel />
      </Balao>
    </div>
  );
}
