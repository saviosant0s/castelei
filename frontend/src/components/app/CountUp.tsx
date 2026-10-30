"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect } from "react";
import { formatNumber } from "@/lib/format";

/*
| Um número que sobe contando de zero até o valor, uma vez, ao aparecer.
| Serve para a notícia da tela (o acerto do resultado, o XP ganho): o olho
| acompanha o número subir e entende que aquilo acabou de acontecer.
*/
export function CountUp({ value, prefix = "", duration = 0.9, delay = 0, className = "" }: { value: number; prefix?: string; duration?: number; delay?: number; className?: string }) {
  const reduzir = useReducedMotion();
  const v = useMotionValue(reduzir ? value : 0);
  const texto = useTransform(v, (n) => `${prefix}${formatNumber(Math.round(n))}`);

  useEffect(() => {
    if (reduzir) {
      v.set(value);
      return;
    }
    const c = animate(v, value, { duration, delay, ease: [0.22, 1, 0.36, 1] });
    return () => c.stop();
  }, [value, duration, delay, reduzir, v]);

  // Quem ouve a tela escuta o número final, e não a contagem.
  return (
    <span className={className}>
      <span className="sr-only">{`${prefix}${formatNumber(value)}`}</span>
      <motion.span aria-hidden="true">{texto}</motion.span>
    </span>
  );
}
