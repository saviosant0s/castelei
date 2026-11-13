import { describe, expect, it } from "vitest";
import { materiasDeQuestao, niveisDaLicao, porModulo, totalDaLicao } from "@/lib/question-bank";
import type { LessonSummary, Subject } from "@/lib/types";

const licao = (id: number, module: string | null, levels?: LessonSummary["levels"]): LessonSummary => ({
  id, title: `L${id}`, position: id, module, questions_total: 8, questions_available: 8, attempts: 0, best_percent: null, levels,
});

describe("tela Questões", () => {
  it("lista os níveis que existem, na ordem fácil → difícil", () => {
    expect(niveisDaLicao(licao(1, null, { dificil: 2, facil: 3 }))).toEqual([
      { nivel: "facil", total: 3 },
      { nivel: "dificil", total: 2 },
    ]);
    expect(niveisDaLicao(licao(1, null))).toEqual([]);
  });

  it("soma a base com os níveis", () => {
    expect(totalDaLicao(licao(1, null, { facil: 2, media: 2, dificil: 2 }))).toBe(14);
  });

  it("agrupa módulos seguidos, como a trilha", () => {
    const blocos = porModulo([licao(1, "A"), licao(2, "A"), licao(3, "B"), licao(4, "A")]);
    expect(blocos.map((b) => [b.module, b.lessons.length])).toEqual([["A", 2], ["B", 1], ["A", 1]]);
  });

  it("deixa de fora a matéria de escrita", () => {
    const base = { lessons: [licao(1, null)] } as unknown as Subject;
    const escrita = { ...base, exam: { writing: true } } as unknown as Subject;
    const questoes = { ...base, exam: { writing: false } } as unknown as Subject;
    expect(materiasDeQuestao([escrita, questoes])).toEqual([questoes]);
  });
});
