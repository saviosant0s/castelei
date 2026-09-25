import { describe, expect, it } from "vitest";
import { POR_RODADA, baralho } from "@/lib/flashcards";
import type { VocabularyTerm } from "@/lib/types";

const termo = (word: string, seen: boolean): VocabularyTerm => ({
  word,
  meaning: `significado de ${word}`,
  lesson: { id: 1, title: "Lição", position: 1 },
  seen,
});

describe("baralho", () => {
  it("usa só as palavras já vistas quando há pelo menos cinco", () => {
    const termos = [...Array.from({ length: 6 }, (_, i) => termo(`vista${i}`, true)), termo("nova", false)];
    const cartas = baralho(termos, () => 0.5);
    expect(cartas).toHaveLength(6);
    expect(cartas.every((c) => c.seen)).toBe(true);
  });

  it("com poucas vistas, entra a matéria inteira", () => {
    const termos = [termo("a", true), termo("b", false), termo("c", false)];
    expect(baralho(termos, () => 0.5)).toHaveLength(3);
  });

  it("para em vinte por rodada e não repete carta", () => {
    const termos = Array.from({ length: 50 }, (_, i) => termo(`p${i}`, true));
    const cartas = baralho(termos, Math.random);
    expect(cartas).toHaveLength(POR_RODADA);
    expect(new Set(cartas.map((c) => c.word)).size).toBe(POR_RODADA);
  });
});
