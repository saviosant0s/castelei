import type { ReactNode } from "react";
import { GAP, NODE } from "@/lib/lesson-trail";

/**
 * O rótulo ao lado de um nó da trilha: a plaquinha com o título.
 *
 * Fica do lado oposto ao do caminho (`labelSide`) e ocupa toda a largura que
 * sobra até a borda. É uma plaquinha levantada, e não texto solto, porque a
 * curva que liga dois nós ainda cruza essa faixa: o traço passa POR TRÁS
 * dela, e o texto nunca fica riscado.
 *
 * Centrado na altura do nó, e não alinhado pelo topo: título de uma linha e
 * título de três linhas continuam olhando para o próprio círculo.
 */
export function TrailLabel({
  x,
  side,
  emphasis = false,
  children,
}: {
  /** centro do nó, em % */
  x: number;
  side: "left" | "right";
  /** a lição atual: plaquinha com borda, para o olho achar onde parar */
  emphasis?: boolean;
  children: ReactNode;
}) {
  const afastamento = `${NODE / 2 + GAP}px`;
  const posicao =
    side === "left"
      ? { left: 0, right: `calc(${100 - x}% + ${afastamento})` }
      : { left: `calc(${x}% + ${afastamento})`, right: 0 };

  return (
    <span
      className={`absolute top-1/2 flex -translate-y-1/2 ${side === "left" ? "justify-end" : "justify-start"}`}
      style={posicao}
    >
      <span
        className={`block max-w-full rounded-control bg-surface-raised px-3 py-2 shadow-lift ${
          side === "left" ? "text-right" : "text-left"
        } ${emphasis ? "ring-2 ring-ink/15" : ""}`}
      >
        {children}
      </span>
    </span>
  );
}
