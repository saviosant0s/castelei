import narrated from "./narracao.json";
import { narrationKey, narrationText } from "./narration-text";
import type { LessonStep } from "./types";

/** As etapas já gravadas (resumos do texto). Ver `narration-text.ts`. */
const available = new Set<string>(narrated as string[]);

/** Endereço do áudio da etapa, ou `null` se ela ainda não foi gravada. */
export function narrationSrc(step: LessonStep): string | null {
  const key = narrationKey(narrationText(step));
  return available.has(key) ? `/narracao/${key}.mp3` : null;
}
