"use client";

import { animate, motion, useAnimate, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { Check } from "lucide-react";
import { useLayoutEffect } from "react";
import { lembrado, lembrar } from "@/lib/remembered";

/*
| O anel da meta do dia: enche com o XP ganho hoje.
|
| O mesmo desenho no cabeçalho (pequeno) e na tela inicial (grande). Quando a
| meta fecha, o miolo vira um certo e o anel dá um pulo — a comemoração é do
| tamanho da conquista: pequena, mas que se vê.
|
| A animação anda por valores do motion (`useMotionValue`), e não por estado
| do React: mexer no estado dentro de um efeito redesenharia a tela a cada
| quadro.
*/
export function GoalRing({ today, target, size, big = false }: { today: number; target: number; size: number; big?: boolean }) {
  const reduzir = useReducedMotion();
  const completa = today >= target;
  const traco = big ? 12 : 4;
  const r = (size - traco) / 2;
  const volta = 2 * Math.PI * r;
  const valor = useMotionValue(today);
  const offset = useTransform(valor, (v) => volta * (1 - Math.min(1, target > 0 ? v / target : 0)));
  const numero = useTransform(valor, (v) => String(Math.round(v)));
  const [escopo, animarEscopo] = useAnimate();

  useLayoutEffect(() => {
    const chave = big ? "meta-grande" : "meta";
    const anterior = lembrado(chave);
    lembrar(chave, today);
    if (reduzir || anterior === null || anterior === today) return;
    valor.set(anterior);
    const c = animate(valor, today, { duration: 0.9, ease: [0.22, 1, 0.36, 1] });
    if (anterior < target && today >= target && escopo.current) {
      animarEscopo(escopo.current, { scale: [1, 1.18, 1] }, { duration: 0.5, delay: 0.8 });
    }
    return () => c.stop();
  }, [today, target, big, reduzir, valor, escopo, animarEscopo]);

  return (
    <span ref={escopo} className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={traco} className="stroke-surface-sunken" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={traco}
          strokeLinecap="round"
          className="stroke-sage"
          strokeDasharray={volta}
          style={{ strokeDashoffset: offset }}
        />
      </svg>
      {big ? (
        <span className="relative text-center">
          {completa ? (
            <Check className="mx-auto size-10 text-sage" aria-hidden="true" />
          ) : (
            <motion.span className="block font-display text-4xl font-bold tabular-nums">{numero}</motion.span>
          )}
          <span className="mt-1 block text-xs text-content-subtle">{completa ? "meta de hoje feita" : `de ${target} XP hoje`}</span>
        </span>
      ) : completa ? (
        <Check className="relative size-3.5 text-sage" aria-hidden="true" />
      ) : null}
    </span>
  );
}
