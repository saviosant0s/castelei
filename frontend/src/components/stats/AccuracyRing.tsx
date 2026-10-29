"use client";

import { animate, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

/*
| O número grande do Progresso: o acerto, num anel que enche ao abrir a tela.
|
| A animação é o que dá cara de app — o número sobe contando e o anel
| acompanha. Quem pediu menos movimento no aparelho vê o valor direto.
*/
export function AccuracyRing({ value, size = 112 }: { value: number; size?: number }) {
  const reduzir = useReducedMotion();
  const [mostrado, setMostrado] = useState(reduzir ? value : 0);
  const traco = 11;
  const r = (size - traco) / 2;
  const volta = 2 * Math.PI * r;

  useEffect(() => {
    if (reduzir) return;
    const controle = animate(0, value, { duration: 0.9, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setMostrado(Math.round(v)) });
    return () => controle.stop();
  }, [value, reduzir]);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
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
          initial={{ strokeDashoffset: reduzir ? volta * (1 - value / 100) : volta }}
          animate={{ strokeDashoffset: volta * (1 - value / 100) }}
          transition={{ duration: reduzir ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display text-3xl font-bold tabular-nums">{mostrado}%</span>
    </div>
  );
}
