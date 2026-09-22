import { describe, expect, it } from "vitest";
import { agrupar, contagem, letraDe } from "./vocabulary";
import type { VocabularyTerm } from "./types";

function termo(word: string): VocabularyTerm {
  return { word, meaning: "significado", lesson: { id: 1, title: "Lição", position: 1 } };
}

describe("letra de dicionário", () => {
  it("ignora o acento", () => {
    // Sem isso, "Índice" abriria um grupo "Í" sozinho, longe do "I".
    expect(letraDe("Índice")).toBe("I");
    expect(letraDe("Âncora")).toBe("A");
    expect(letraDe("Órfão")).toBe("O");
  });

  it("não separa maiúscula de minúscula", () => {
    expect(letraDe("kernel")).toBe("K");
  });

  it("número e símbolo vão para '#', como em índice de livro", () => {
    expect(letraDe("404")).toBe("#");
    expect(letraDe("/etc/hosts")).toBe("#");
  });
});

describe("agrupamento", () => {
  it("junta as palavras da mesma letra e preserva a ordem do servidor", () => {
    // A ordenação é do backend, onde mora a regra de unicidade. Reordenar
    // aqui seria uma segunda régua, que discordaria da primeira um dia.
    const grupos = agrupar([termo("Índice"), termo("IP"), termo("Kernel"), termo("Zona")]);

    expect(grupos.map((g) => g.letra)).toEqual(["I", "K", "Z"]);
    expect(grupos[0].termos.map((t) => t.word)).toEqual(["Índice", "IP"]);
  });

  it("lista vazia não vira um grupo vazio", () => {
    expect(agrupar([])).toEqual([]);
  });
});

describe("contagem", () => {
  it("concorda o número com o substantivo", () => {
    expect(contagem(0)).toBe("Nenhuma palavra ainda");
    expect(contagem(1)).toBe("1 palavra");
    expect(contagem(12)).toBe("12 palavras");
  });
});
