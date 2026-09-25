import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { WRITING_CHECKS, aiPrompt, assemble, checkWriting, sentences } from "@/lib/writing";

const base = { min_chars: 0, max_chars: 400, checks: [] as string[] };
const achar = (texto: string, id: string, checks: string[] = []) =>
  checkWriting(texto, { ...base, checks }).find((c) => c.id === id)!;

describe("checkWriting", () => {
  it("texto vazio mostra tudo pendente, sem acusar nada", () => {
    const lista = checkWriting("", { ...base, checks: ["uma_frase", "conectivo"] });
    expect(lista.every((c) => !c.ok)).toBe(true);
    expect(lista.every((c) => c.detail === undefined)).toBe(true);
  });

  it("confere o tamanho pelos dois lados", () => {
    const brief = { min_chars: 20, max_chars: 30, checks: [] };
    expect(checkWriting("curto.", brief)[0]).toMatchObject({ ok: false, detail: "Faltam 14 caracteres." });
    expect(checkWriting("Um texto do tamanho certo.", brief)[0].ok).toBe(true);
    expect(checkWriting("Um texto que passou bastante do tamanho.", brief)[0].ok).toBe(false);
  });

  it("uma frase só", () => {
    expect(achar("O celular ajuda a aprender.", "uma_frase", ["uma_frase"]).ok).toBe(true);
    expect(achar("O celular ajuda. Mas distrai.", "uma_frase", ["uma_frase"]).ok).toBe(false);
  });

  it("marca de fala com acento é encontrada (o \\b do JavaScript não enxerga acento)", () => {
    const r = achar("O celular é bom né, mas pra estudar a gente precisa de foco.", "oralidade");
    expect(r.ok).toBe(false);
    expect(r.detail).toContain("né");
    expect(r.detail).toContain("pra");
    expect(r.detail).toContain("a gente");
  });

  it("não confunde palavra dentro de outra palavra", () => {
    // "massa" tem "mas"; "tipografia" tem "tipo"; "prato" tem "pra".
    expect(achar("A massa do prato tem tipografia.", "oralidade").ok).toBe(true);
    expect(achar("A massa estava fria.", "conectivo", ["conectivo"]).ok).toBe(false);
    expect(achar("Estava fria, mas estava boa.", "conectivo", ["conectivo"]).ok).toBe(true);
  });

  it("conclusão pede conectivo de conclusão", () => {
    expect(achar("Portanto, o celular deve ficar.", "conclusivo", ["conclusivo"]).ok).toBe(true);
    expect(achar("O celular deve ficar.", "conclusivo", ["conclusivo"]).ok).toBe(false);
  });

  it("contra-argumento aceita concessão ou oposição", () => {
    expect(achar("É verdade que o celular distrai.", "concessivo", ["concessivo"]).ok).toBe(true);
    expect(achar("O celular distrai; no entanto, ensina.", "concessivo", ["concessivo"]).ok).toBe(true);
    expect(achar("O celular distrai.", "concessivo", ["concessivo"]).ok).toBe(false);
  });

  it("tese sem pergunta e sem eu acho", () => {
    expect(achar("Será que o celular ajuda?", "sem_pergunta", ["sem_pergunta"]).ok).toBe(false);
    const fraca = achar("Eu acho que o celular ajuda.", "sem_eu_acho", ["sem_eu_acho"]);
    expect(fraca.ok).toBe(false);
    expect(fraca.detail).toContain("eu acho");
  });

  it("acusa a palavra repetida, ignorando as comuns", () => {
    const r = achar("O celular distrai. O celular vicia. O celular isola. Que que que.", "repeticao");
    expect(r.detail).toContain("“celular” aparece 3 vezes");
  });

  it("acusa frase longa demais", () => {
    const longa = `${Array.from({ length: 45 }, () => "palavra").join(" ")}.`;
    expect(achar(longa, "frases_longas").ok).toBe(false);
  });

  it("título: primeira linha curta, sem ponto, e o texto embaixo", () => {
    expect(achar("Celular na escola\n\nO texto começa aqui.", "titulo", ["titulo"]).ok).toBe(true);
    expect(achar("O texto começa aqui.", "titulo", ["titulo"]).ok).toBe(false);
    expect(achar("Celular na escola.\n\nO texto.", "titulo", ["titulo"]).ok).toBe(false);
  });
});

describe("sentences e assemble", () => {
  it("parte frases e ignora pedaços sem letra", () => {
    expect(sentences("Uma frase. Outra! E mais uma? …")).toEqual(["Uma frase.", "Outra!", "E mais uma?"]);
  });

  it("junta as partes em parágrafos, pulando as vazias", () => {
    expect(assemble(["  Introdução. ", "", "Argumento."])).toBe("Introdução.\n\nArgumento.");
  });
});

describe("aiPrompt", () => {
  it("leva proposta, roteiro, critérios e o texto", () => {
    const p = aiPrompt({ statement: "Escreva a tese.", steps: ["Uma frase."], checklist: ["Dá para discordar?"], text: " Minha tese. " });
    expect(p).toContain("Proposta: Escreva a tese.");
    expect(p).toContain("- Uma frase.");
    expect(p).toContain("- Dá para discordar?");
    expect(p).toContain('"""\nMinha tese.\n"""');
  });
});

describe("a lista de conferências é a mesma nas duas pontas", () => {
  it("bate com ContentValidator::WRITING_CHECKS", () => {
    const php = readFileSync(resolve(__dirname, "../../../backend/app/Support/Content/ContentValidator.php"), "utf8");
    const bloco = php.match(/WRITING_CHECKS = \[([\s\S]*?)\];/)?.[1] ?? "";
    const doBackend = [...bloco.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    expect(doBackend).toEqual([...WRITING_CHECKS]);
  });
});
