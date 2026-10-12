import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import narrated from "./narracao.json";
import { narrationKey, narrationText } from "./narration-text";
import type { LessonStep } from "./types";

const step: LessonStep = {
  kind: "explain",
  title: "O jogo",
  body: ["Dois números aparecem", "A criança escolhe o maior."],
  code: { text: "waitpid(pid, 0)", notes: ["Espera o filho terminar"] },
  terms: [{ word: "Rodada", meaning: "uma jogada" }],
};

describe("narração", () => {
  it("lê o texto e a tradução do código, nunca o código", () => {
    const text = narrationText(step);
    expect(text).toContain("Dois números aparecem.");
    expect(text).toContain("Espera o filho terminar.");
    expect(text).toContain("Palavra nova.\nRodada: uma jogada.");
    expect(text).not.toContain("waitpid");
  });

  it("muda de arquivo quando o texto muda", () => {
    const outro = { ...step, body: ["Três números aparecem."] };
    expect(narrationKey(narrationText(step))).not.toBe(narrationKey(narrationText(outro)));
    expect(narrationKey("a")).toBe(narrationKey("a"));
  });

  it("toda etapa marcada como gravada tem o arquivo de áudio", () => {
    for (const key of narrated as string[]) {
      expect(existsSync(join(process.cwd(), "public/narracao", `${key}.mp3`)), key).toBe(true);
    }
  });
});
