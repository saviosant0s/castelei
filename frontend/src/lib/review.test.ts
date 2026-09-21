import { describe, expect, it } from "vitest";
import { porQueAgora, quandoVence, resumoDaProva, tituloDaFila, ultimoResultado } from "@/lib/review";
import type { ReviewItem } from "@/lib/types";

function item(extra: Partial<ReviewItem> = {}): ReviewItem {
  return {
    lesson_id: 1,
    lesson_title: "Escalonamento",
    subject_name: "Sistemas Operacionais",
    subject_slug: "sistemas-operacionais",
    due_at: "2026-10-01T12:00:00-03:00",
    days_late: 0,
    last_percent: 70,
    interval_days: 13,
    days_to_exam: 90,
    ...extra,
  };
}

describe("quandoVence", () => {
  it("fala no singular quando é um dia só", () => {
    expect(quandoVence(1)).toBe("Atrasada 1 dia");
    expect(quandoVence(-1)).toBe("Vence amanhã");
  });

  it("não escreve 'em 0 dias'", () => {
    expect(quandoVence(0)).toBe("Vence hoje");
  });

  it("nunca mostra número negativo", () => {
    expect(quandoVence(-5)).toBe("Vence em 5 dias");
    expect(quandoVence(-5)).not.toContain("-");
  });

  it("conta os dias de atraso", () => {
    expect(quandoVence(3)).toBe("Atrasada 3 dias");
  });
});

describe("ultimoResultado", () => {
  it("não inventa nota quando não há", () => {
    expect(ultimoResultado(null)).toBeNull();
  });

  it("escreve a nota anterior", () => {
    expect(ultimoResultado(60)).toBe("Você fez 60% da última vez.");
  });
});

describe("porQueAgora", () => {
  it("explica pelo tempo que falta para a prova", () => {
    expect(porQueAgora(item())).toBe(
      "Faltam 90 dias para a prova, então esta lição volta a cada 13 dias.",
    );
  });

  it("sem data de prova, não fala de prova nenhuma", () => {
    const texto = porQueAgora(item({ days_to_exam: null, interval_days: 7 }));
    expect(texto).not.toContain("prova");
    expect(texto).toContain("7 dias");
  });

  it("acerta o singular de um dia", () => {
    expect(porQueAgora(item({ days_to_exam: 1, interval_days: 1 }))).toBe(
      "Falta 1 dia para a prova, então esta lição volta a cada 1 dia.",
    );
  });
});

describe("tituloDaFila", () => {
  it("fala no singular com uma lição", () => {
    expect(tituloDaFila(1)).toBe("1 lição para revisar");
  });

  it("fala no plural com várias", () => {
    expect(tituloDaFila(4)).toBe("4 lições para revisar");
  });

  it("não diz '0 lições'", () => {
    expect(tituloDaFila(0)).toBe("Nada para revisar");
  });
});

describe("resumoDaProva", () => {
  it("usa a prova mais próxima entre as lições da fila", () => {
    const texto = resumoDaProva([
      item({ days_to_exam: 85, subject_name: "Sistemas Operacionais" }),
      item({ days_to_exam: 12, subject_name: "Português" }),
    ]);

    expect(texto).toContain("Faltam 12 dias");
    expect(texto).toContain("Português");
  });

  it("não fala de prova quando nenhuma matéria tem data", () => {
    expect(resumoDaProva([item({ days_to_exam: null })])).toBeNull();
  });

  it("acerta o singular de um dia", () => {
    expect(resumoDaProva([item({ days_to_exam: 1 })])).toContain("Falta 1 dia para a prova");
  });

  it("não quebra com a fila vazia", () => {
    expect(resumoDaProva([])).toBeNull();
  });
});
