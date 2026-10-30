"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Flame, Star } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { DailyGoalPicker } from "./DailyGoalPicker";
import { GoalRing } from "./GoalRing";
import { formatNumber } from "@/lib/format";
import type { AppBarResponse } from "@/lib/types";

type Gami = NonNullable<AppBarResponse["gamification"]>;

/*
| Os balões do cabeçalho: tocar na chama, no XP ou no anel abre um balão logo
| embaixo, em vez de levar a outra tela. Pedido do Sávio: a meta morava no
| Perfil, e ir até lá para ver ou trocar uma coisa do topo era um desvio.
|
| Fecha ao tocar fora, no Esc ou tocando de novo no mesmo item. Um aberto por
| vez: quem controla é o `AppBarStats`.
*/
export function Balao({
  aberto,
  aoFechar,
  rotulo,
  alinhar = "right",
  ancora,
  children,
}: {
  aberto: boolean;
  aoFechar: () => void;
  rotulo: string;
  alinhar?: "right" | "center";
  /** O elemento que contém o gatilho: tocar nele não conta como "fora". */
  ancora: React.RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const reduzir = useReducedMotion();

  useEffect(() => {
    if (!aberto) return;
    function fora(e: PointerEvent) {
      const alvo = e.target as Node;
      if (ancora.current?.contains(alvo)) return;
      aoFechar();
    }
    function tecla(e: KeyboardEvent) {
      if (e.key === "Escape") aoFechar();
    }
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", fora);
      document.removeEventListener("keydown", tecla);
    };
  }, [aberto, aoFechar, ancora]);

  const posicao =
    alinhar === "center" ? "left-1/2 -translate-x-1/2" : "right-0";

  return (
    <AnimatePresence>
      {aberto && (
        <div className={`absolute top-full z-40 mt-2 ${posicao}`}>
          <motion.div
            role="dialog"
            aria-label={rotulo}
            initial={reduzir ? false : { opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduzir ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="w-[min(20rem,calc(100vw-2rem))] rounded-card border border-ink/10 bg-surface-raised p-4 text-left shadow-lift"
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

const LETRAS = ["D", "S", "T", "Q", "Q", "S", "S"];
const NOMES = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

/** A semana da chama: um fogo em cada dia em que a pessoa estudou. */
export function PainelChama({ gami }: { gami: Gami }) {
  const hoje = gami.week.filter((d) => !d.future).length - 1;
  const acesa = gami.streak > 0 && gami.studied_today;
  const titulo =
    gami.streak === 0 ? "Comece hoje a sua sequência" : `${gami.streak} ${gami.streak === 1 ? "dia seguido" : "dias seguidos"}`;
  const frase = acesa
    ? "Hoje já conta. Volte amanhã para a chama crescer."
    : gami.streak > 0
      ? "Estude hoje para não perder a sequência."
      : "Uma lição hoje acende o primeiro fogo.";

  return (
    <>
      <p className="font-display text-lg font-bold">{titulo}</p>
      <p className="mt-0.5 text-sm text-content-secondary">{frase}</p>
      <ol className="mt-4 grid grid-cols-7 gap-1" aria-label="Esta semana">
        {gami.week.map((d, i) => (
          <li
            key={d.date}
            className="flex flex-col items-center gap-1.5"
            aria-label={`${NOMES[i]}: ${d.future ? "ainda não chegou" : d.studied ? "estudou" : "não estudou"}`}
          >
            <span className={`text-xs font-bold ${i === hoje ? "text-content" : "text-content-subtle"}`}>{LETRAS[i]}</span>
            <span
              className={`grid size-9 place-items-center rounded-full ${
                d.studied
                  ? "bg-coral-soft"
                  : d.future
                    ? "border-2 border-dashed border-ink/10"
                    : "bg-surface-sunken"
              } ${i === hoje ? "ring-2 ring-coral/60 ring-offset-2 ring-offset-surface-raised" : ""}`}
            >
              {d.studied && <Flame className="size-5 fill-coral text-coral" aria-hidden="true" />}
            </span>
          </li>
        ))}
      </ol>
    </>
  );
}

/** O nível: onde a pessoa está e quanto falta para o próximo. */
export function PainelNivel({ gami }: { gami: Gami }) {
  const { current, floor, next } = gami.level;
  const feito = gami.xp - floor;
  const degrau = next - floor;
  const falta = next - gami.xp;
  const pct = degrau > 0 ? Math.min(100, Math.round((feito / degrau) * 100)) : 0;

  return (
    <>
      <div className="flex items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-gold-soft font-display text-xl font-bold text-gold">
          {current}
        </span>
        <div>
          <p className="font-display text-lg font-bold">Nível {current}</p>
          <p className="text-sm text-content-secondary">
            <Star className="mr-1 inline size-3.5 fill-gold text-gold align-[-2px]" aria-hidden="true" />
            {formatNumber(gami.xp)} XP no total
          </p>
        </div>
      </div>
      <div
        className="mt-4 h-3 overflow-hidden rounded-pill bg-surface-sunken"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={degrau}
        aria-valuenow={feito}
        aria-label={`Rumo ao nível ${current + 1}`}
      >
        <div className="h-full rounded-pill bg-gold" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-xs font-bold text-content-subtle">
        <span>Nível {current}</span>
        <span>Nível {current + 1}</span>
      </div>
      <p className="mt-3 text-sm text-content-secondary">
        Faltam <strong className="text-content">{formatNumber(falta)} XP</strong> para o nível {current + 1}. Cada acerto vale 20.
      </p>
    </>
  );
}

/** A meta do dia: o anel, quanto já foi e a escolha entre as três metas. */
export function PainelMeta({ goal, semAnel = false }: { goal: Gami["goal"]; semAnel?: boolean }) {
  const feita = goal.today >= goal.target;
  const falta = goal.target - goal.today;
  return (
    <>
      <div className="flex items-center gap-3">
        {!semAnel && <GoalRing today={goal.today} target={goal.target} size={48} />}
        <div>
          <p className="font-display text-lg font-bold">Meta do dia</p>
          <p className="text-sm text-content-secondary">
            {feita ? "Feita! O resto de hoje é bônus." : `${goal.today} de ${goal.target} XP · faltam ${falta}`}
          </p>
        </div>
      </div>
      <p className="mt-4 mb-2 text-sm font-bold text-label">Quanto você quer por dia?</p>
      <DailyGoalPicker atual={goal.target} />
    </>
  );
}
