import { describe, expect, it } from "vitest";
import { minutosDeLeitura, palavrasDaLicao, resumoDaLicao } from "@/lib/lesson-hub";
import type { LessonStep } from "@/lib/types";

const etapa = (kind: LessonStep["kind"], body: string, terms?: LessonStep["terms"]): LessonStep => ({ kind, title: kind, body: [body], terms });

describe("tela da lição", () => {
  it("estima a leitura em minutos, nunca menos de um", () => {
    expect(minutosDeLeitura([etapa("idea", "curto")])).toBe(1);
    expect(minutosDeLeitura([etapa("idea", Array(540).fill("palavra").join(" "))])).toBe(3);
  });

  it("acha o resumo pela etapa de recap", () => {
    expect(resumoDaLicao([etapa("idea", "a"), etapa("recap", "fim")])?.body).toEqual(["fim"]);
    expect(resumoDaLicao([etapa("idea", "a")])).toBeNull();
  });

  it("junta as palavras novas sem repetir", () => {
    const passos = [etapa("idea", "a", [{ word: "Feudo", meaning: "terra" }]), etapa("explain", "b", [{ word: "feudo", meaning: "de novo" }, { word: "servo", meaning: "camponês" }])];
    expect(palavrasDaLicao(passos).map((p) => p.word)).toEqual(["Feudo", "servo"]);
  });
});
