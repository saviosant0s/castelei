import type { Difficulty, LessonSummary, Subject } from "@/lib/types";

/*
| A tela Questões: escolher a matéria, a lição e (no Pro) o nível.
|
| Pedido do Sávio, novembro de 2026: a escolha de nível no fim da lição
| atrapalhava. Quem termina de estudar faz as questões da lição, sem escolher
| nada; quem quer treinar vem aqui, numa tela só para isso.
*/
export const NIVEIS: Difficulty[] = ["facil", "media", "dificil"];

/** Matéria de escrita não entra: a prática dela é texto, não questão. */
export function materiasDeQuestao(subjects: Subject[]): Subject[] {
  return subjects.filter((s) => !s.exam?.writing && s.lessons.some((l) => l.questions_total > 0));
}

/** Os níveis que a lição tem, na ordem fácil → difícil. */
export function niveisDaLicao(lesson: LessonSummary): { nivel: Difficulty; total: number }[] {
  return NIVEIS.map((nivel) => ({ nivel, total: lesson.levels?.[nivel] ?? 0 })).filter((n) => n.total > 0);
}

/** Total de questões da lição: as da prática comum mais as de nível. */
export function totalDaLicao(lesson: LessonSummary): number {
  return lesson.questions_total + niveisDaLicao(lesson).reduce((soma, n) => soma + n.total, 0);
}

/** As lições em blocos de módulo seguidos, como na trilha da matéria. */
export function porModulo(lessons: LessonSummary[]): { module: string | null; lessons: LessonSummary[] }[] {
  const blocos: { module: string | null; lessons: LessonSummary[] }[] = [];
  for (const lesson of lessons) {
    const ultimo = blocos[blocos.length - 1];
    if (ultimo && ultimo.module === lesson.module) ultimo.lessons.push(lesson);
    else blocos.push({ module: lesson.module, lessons: [lesson] });
  }
  return blocos;
}
