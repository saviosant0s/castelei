"use client";

import { useSpot } from "@/lib/lesson-progress";

/**
 * "parou na etapa 4 de 11", na plaquinha da lição na trilha.
 *
 * Onde a pessoa parou mora no navegador, e a trilha é desenhada no servidor.
 * Por isso o texto só aparece depois que a página monta — até lá o nó já está
 * completo sem ele.
 */
export function TrailResume({ lessonId }: { lessonId: number }) {
  const spot = useSpot(lessonId);

  if (!spot) return null;

  return (
    <span className="mt-1 block text-xs leading-tight font-bold text-content-secondary">
      parou na etapa {spot.step + 1} de {spot.total}
    </span>
  );
}
