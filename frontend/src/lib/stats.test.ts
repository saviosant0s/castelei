import { describe, expect, it } from "vitest";
import { mapModules, mapState, readiness } from "./stats";
import type { StatsLesson, StatsSubject } from "./types";

const licao = (id: number, mastery: number | null, module: string | null = null): StatsLesson => ({
  id,
  title: `Lição ${id}`,
  module,
  mastery,
});

const materia = (over: Partial<StatsSubject>): StatsSubject => ({
  id: 1,
  slug: "so",
  name: "Sistemas Operacionais",
  exam_date: null,
  days_to_exam: null,
  lessons_total: 30,
  lessons_started: 10,
  lessons_mastered: 8,
  lessons: [],
  ...over,
});

describe("mapState", () => {
  it("separa a lição nunca praticada da que foi mal", () => {
    expect(mapState(licao(1, null))).toBe("nova");
    expect(mapState(licao(1, 0))).toBe("revisar");
    expect(mapState(licao(1, 62))).toBe("evoluindo");
    expect(mapState(licao(1, 80))).toBe("dominado");
  });
});

describe("readiness", () => {
  it("diz o ritmo por semana quando a prova está longe", () => {
    // 22 lições em 7 semanas: 3,14 por semana, arredonda para cima.
    expect(readiness(materia({ days_to_exam: 49 }))).toBe("Faltam 22 lições e 49 dias: cerca de 4 lições por semana.");
  });

  it("diz o ritmo por dia na última semana", () => {
    expect(readiness(materia({ days_to_exam: 1, lessons_mastered: 29 }))).toBe(
      "Falta 1 lição e 1 dia: cerca de 1 lição por dia.",
    );
  });

  it("sem prova marcada, não inventa ritmo", () => {
    expect(readiness(materia({}))).toBe("Faltam 22 lições para dominar a matéria. Não há data de prova marcada.");
  });

  it("matéria dominada vira convite para revisar", () => {
    expect(readiness(materia({ lessons_mastered: 30, days_to_exam: 10 }))).toMatch(/domina a matéria inteira/);
  });
});

describe("mapModules", () => {
  it("agrupa lições seguidas do mesmo módulo e numera pela ordem da matéria", () => {
    const modulos = mapModules([licao(10, null, "A"), licao(11, null, "A"), licao(12, null, "B"), licao(13, null, "A")]);

    expect(modulos.map((m) => m.name)).toEqual(["A", "B", "A"]);
    expect(modulos[2].lessons[0].number).toBe(4);
  });
});
