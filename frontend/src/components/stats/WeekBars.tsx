"use client";

import { motion, useReducedMotion } from "motion/react";
import type { StatsResponse } from "@/lib/types";

const LETRA = ["D", "S", "T", "Q", "Q", "S", "S"];

/*
| Quanto se estudou em cada um dos últimos 7 dias. Uma barra por dia, e o dia
| sem estudo vira um traço — não some, porque o buraco é parte do que a
| pessoa precisa ver. Hoje vem no tom mais fundo.
*/
export function WeekBars({ days }: { days: StatsResponse["week"]["days"] }) {
  const reduzir = useReducedMotion();
  const maior = Math.max(1, ...days.map((d) => d.answered));

  return (
    <ol className="mt-4 flex h-32 items-end gap-2.5" aria-label="Questões respondidas em cada um dos últimos 7 dias">
      {days.map((d, i) => {
        const hoje = i === days.length - 1;
        const altura = d.answered === 0 ? 4 : Math.max(10, (d.answered / maior) * 96);
        const dia = new Date(`${d.date}T12:00:00`);
        return (
          <li key={d.date} className="flex flex-1 flex-col items-center gap-1.5" aria-label={`${d.answered} questões`}>
            <motion.span
              className={`block w-full rounded-t-lg rounded-b-sm ${d.answered === 0 ? "bg-surface-sunken" : hoje ? "bg-sky-deep" : "bg-sky"}`}
              initial={{ height: reduzir ? altura : 4 }}
              animate={{ height: altura }}
              transition={{ duration: reduzir ? 0 : 0.6, delay: reduzir ? 0 : i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            />
            <span className={`text-xs ${hoje ? "font-bold text-content" : "text-content-subtle"}`}>{LETRA[dia.getDay()]}</span>
          </li>
        );
      })}
    </ol>
  );
}
