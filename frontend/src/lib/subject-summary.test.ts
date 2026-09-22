import { describe, expect, it } from "vitest";
import {
  contagemParaProva,
  dataPorExtenso,
  diasEntre,
  hojeNoFuso,
  progressoDaMateria,
} from "./subject-summary";
import type { LessonSummary } from "./types";

function licao(position: number, attempts = 0): LessonSummary {
  return {
    id: position,
    title: `Lição ${position}`,
    position,
    module: "Fundamentos",
    questions_total: 8,
    questions_available: 8,
    attempts,
    best_percent: attempts > 0 ? 70 : null,
  };
}

describe("contagem para a prova", () => {
  it("conta em dias de calendário", () => {
    expect(contagemParaProva("2026-12-15", "2026-09-22")?.dias).toBe(84);
  });

  it("concorda o verbo com o número", () => {
    // "Falta 1 dias" e "Faltam 1 dia" são os dois erros clássicos.
    expect(contagemParaProva("2026-09-23", "2026-09-22")?.frase).toBe("Falta 1 dia para a prova");
    expect(contagemParaProva("2026-09-24", "2026-09-22")?.frase).toBe("Faltam 2 dias para a prova");
  });

  it("o dia da prova tem frase própria, não 'faltam 0 dias'", () => {
    expect(contagemParaProva("2026-09-22", "2026-09-22")?.frase).toBe("A prova é hoje");
  });

  it("prova que passou some, em vez de virar contagem negativa", () => {
    // Cobrar por um prazo que não dá mais para mudar não é informação.
    expect(contagemParaProva("2026-09-21", "2026-09-22")).toBeNull();
  });

  it("matéria sem data marcada não inventa prazo", () => {
    expect(contagemParaProva(null, "2026-09-22")).toBeNull();
    expect(contagemParaProva(undefined, "2026-09-22")).toBeNull();
  });

  it("escreve a data por extenso, sem escorregar de dia", () => {
    // O erro clássico é `new Date("2026-12-15")`, que é meia-noite UTC e vira
    // 14 de dezembro no fuso do Brasil.
    expect(dataPorExtenso("2026-12-15")).toBe("15 de dezembro");
    expect(dataPorExtenso("2026-01-01")).toBe("1 de janeiro");
    expect(dataPorExtenso("2026-03-31")).toBe("31 de março");
  });

  it("atravessa a virada do ano e o horário de verão sem perder um dia", () => {
    expect(diasEntre("2025-12-30", "2026-01-02")).toBe(3);
    expect(diasEntre("2026-10-01", "2026-11-01")).toBe(31);
  });

  it("hoje é o dia do ALUNO, não o do servidor", () => {
    // 01:30 UTC de 23/09 ainda é dia 22 em São Paulo (UTC-3). Se a contagem
    // usasse a data do servidor, a prova encurtaria um dia toda madrugada.
    expect(hojeNoFuso(new Date("2026-09-23T01:30:00Z"))).toBe("2026-09-22");
  });
});

describe("progresso da matéria", () => {
  it("conta lição praticada, não aprovada", () => {
    // Mesma régua da trilha: terminar uma vez basta, nota não entra.
    const progresso = progressoDaMateria([licao(1, 1), licao(2, 3), licao(3), licao(4)]);

    expect(progresso).toEqual({ done: 2, total: 4, percent: 50 });
  });

  it("matéria vazia não divide por zero", () => {
    expect(progressoDaMateria([])).toEqual({ done: 0, total: 0, percent: 0 });
  });
});
