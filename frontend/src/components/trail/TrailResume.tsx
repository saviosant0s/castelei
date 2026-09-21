"use client";

import { useSpot } from "@/lib/lesson-progress";

/**
 * "parou na etapa 4 de 11", embaixo do nó da trilha.
 *
 * Onde a pessoa parou mora no navegador, e a trilha é desenhada no servidor.
 * Por isso o texto só aparece depois que a página monta — até lá o nó já está
 * completo sem ele.
 */
export function TrailResume({ lessonId }: { lessonId: number }) {
  const spot = useSpot(lessonId);

  if (!spot) return null;

  return (
    <span className="mt-1 block rounded-control bg-surface-raised px-2 py-0.5 text-[0.6875rem] leading-tight font-bold text-content shadow-lift">
      parou na etapa {spot.step + 1} de {spot.total}
    </span>
  );
}
