import { describe, expect, it } from "vitest";
import { appendSpoken } from "./useDictation";

describe("appendSpoken", () => {
  it("começa frase com maiúscula", () => {
    expect(appendSpoken("", "o jogo grava tudo")).toBe("O jogo grava tudo");
    expect(appendSpoken("Primeira ideia.", "depois vem a outra")).toBe("Primeira ideia. Depois vem a outra");
  });

  it("continua a frase sem maiúscula e com um espaço só", () => {
    expect(appendSpoken("O evento tem   ", "um tipo")).toBe("O evento tem um tipo");
  });

  it("fala vazia não muda nada", () => {
    expect(appendSpoken("Texto", "  ")).toBe("Texto");
  });
});
