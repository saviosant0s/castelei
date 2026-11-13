import type { LessonStep } from "@/lib/types";

/*
| As contas da tela da lição, separadas da tela para poderem ser testadas.
*/

/** Minutos de leitura, a 180 palavras por minuto, nunca menos de 1. */
export function minutosDeLeitura(steps: LessonStep[]): number {
  const texto = steps
    .flatMap((s) => [s.title, ...(s.body ?? []), ...(s.bullets ?? []), ...(s.terms ?? []).map((t) => `${t.word} ${t.meaning}`)])
    .join(" ");
  const palavras = texto.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palavras / 180));
}

/** A etapa de resumo (a última, do tipo `recap`), se houver. */
export function resumoDaLicao(steps: LessonStep[]): LessonStep | null {
  return [...steps].reverse().find((s) => s.kind === "recap") ?? null;
}

/** As palavras novas da lição, na ordem em que aparecem, sem repetir. */
export function palavrasDaLicao(steps: LessonStep[]): { word: string; meaning: string }[] {
  const vistas = new Set<string>();
  return steps.flatMap((s) => s.terms ?? []).filter((t) => {
    const chave = t.word.toLowerCase();
    if (vistas.has(chave)) return false;
    vistas.add(chave);
    return true;
  });
}
