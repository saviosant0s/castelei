import { describe, expect, it } from "vitest";
import { agruparPorLicao, nivel } from "./progress-groups";
import type { TopicStat } from "./types";

const t = (lesson_id: number, topic: string, correct: number, answered: number): TopicStat => ({
  topic,
  lesson_id,
  lesson_title: `Lição ${lesson_id}`,
  subject_name: "Sistemas Operacionais",
  answered,
  correct,
  accuracy: Math.round((correct / answered) * 100),
  avg_seconds: 30,
});

describe("agruparPorLicao", () => {
  it("junta os tópicos da mesma lição e soma as questões", () => {
    const [grupo] = agruparPorLicao([t(1, "A", 1, 1), t(1, "B", 0, 1), t(1, "C", 1, 2)]);

    expect(grupo.topics).toHaveLength(3);
    expect(grupo.answered).toBe(4);
    expect(grupo.correct).toBe(2);
    expect(grupo.accuracy).toBe(50);
  });

  it("põe a lição mais fraca primeiro, e o tópico mais fraco primeiro dentro dela", () => {
    const grupos = agruparPorLicao([t(1, "Forte", 2, 2), t(2, "X", 0, 2), t(1, "Fraco", 0, 1)]);

    expect(grupos.map((g) => g.lesson_id)).toEqual([2, 1]);
    expect(grupos[1].topics.map((x) => x.topic)).toEqual(["Fraco", "Forte"]);
  });

  it("lista vazia dá lista vazia", () => {
    expect(agruparPorLicao([])).toEqual([]);
  });
});

describe("nivel", () => {
  it("usa a régua de 50 e 80", () => {
    expect(nivel(80)).toBe("dominado");
    expect(nivel(79)).toBe("evoluindo");
    expect(nivel(50)).toBe("evoluindo");
    expect(nivel(49)).toBe("revisar");
  });
});
