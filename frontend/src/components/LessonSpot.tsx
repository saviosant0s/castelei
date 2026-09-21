"use client";

import { useSpot } from "@/lib/lesson-progress";

/**
 * O fim da linha de resumo de uma lição, na lista da matéria.
 *
 * Ele decide entre duas coisas que não podem aparecer juntas: "parou na etapa
 * 4 de 11" e "ainda não praticada". Quem parou no meio da leitura claramente
 * já começou a lição — dizer as duas ao mesmo tempo é contradição.
 *
 * Onde a pessoa parou mora no navegador, e a lista é renderizada no servidor.
 * Por isso o texto só assume a forma final depois que a página monta. Até lá
 * vale a versão do servidor, que já é uma frase completa.
 */
export function LessonSpot({ lessonId, practiced }: { lessonId: number; practiced: boolean }) {
  const spot = useSpot(lessonId);

  if (spot) {
    return (
      <>
        {" · "}
        {/* Sem cor de destaque: azul-céu em 14px sobre branco não tem contraste. */}
        <span className="font-bold text-content">
          parou na etapa {spot.step + 1} de {spot.total}
        </span>
      </>
    );
  }

  return practiced ? null : <>{" · ainda não praticada"}</>;
}
