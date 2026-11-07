import { describe, expect, it } from "vitest";
import { cleanCode, formatCode, licoesMaisFracas, precisamDeAtencao, ultimaVez, type ClassroomMember } from "./classrooms";

const membro = (name: string, days_inactive: number | null): ClassroomMember => ({
  id: name.length,
  name,
  practiced: 0,
  total_lessons: 10,
  accuracy: null,
  last_studied_at: null,
  days_inactive,
});

describe("turmas", () => {
  it("fala o código em dois blocos e limpa o que foi digitado", () => {
    expect(formatCode("ABCDEF")).toBe("ABC-DEF");
    expect(cleanCode(" abc-def ")).toBe("ABCDEF");
  });

  it("diz a última vez sem número estranho", () => {
    expect(ultimaVez(null)).toBe("Ainda não estudou");
    expect(ultimaVez(0)).toBe("Estudou hoje");
    expect(ultimaVez(1)).toBe("Estudou ontem");
    expect(ultimaVez(9)).toBe("Estudou há 9 dias");
  });

  it("põe primeiro quem nunca estudou e depois o mais parado, e deixa de fora quem estuda", () => {
    const lista = precisamDeAtencao([membro("Ana", 2), membro("Bia", 8), membro("Caio", null), membro("Davi", 30)]);
    expect(lista.map((m) => m.name)).toEqual(["Caio", "Davi", "Bia"]);
  });

  it("ordena as lições pela pior e ignora as que ninguém praticou", () => {
    const fracas = licoesMaisFracas([
      { id: 1, title: "A", position: 1, practiced: 3, accuracy: 80 },
      { id: 2, title: "B", position: 2, practiced: 0, accuracy: null },
      { id: 3, title: "C", position: 3, practiced: 2, accuracy: 40 },
    ]);
    expect(fracas.map((l) => l.title)).toEqual(["C", "A"]);
  });
});
