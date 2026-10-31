// @vitest-environment jsdom
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SubjectArt, subjectArtKey } from "./SubjectArt";

/*
| O enfeite de cada matéria vem do desenho dela ou, sem ele, do da área.
| Matéria pública nova sem desenho NENHUM é esquecimento: a tela dela seria a
| única sem enfeite. A privada pode esperar, porque só quem escreve a vê.
*/
const CONTENT_DIR = path.resolve(import.meta.dirname, "../../../../backend/database/seeders/content");

const publicas = readdirSync(CONTENT_DIR)
  .filter((file) => file.endsWith(".json"))
  .map((file) => JSON.parse(readFileSync(path.join(CONTENT_DIR, file), "utf8")) as { slug: string; area?: string; visibility?: string })
  .filter((subject) => subject.visibility !== "private");

describe("SubjectArt", () => {
  it("toda matéria pública tem um desenho, próprio ou da área", () => {
    expect(publicas.length).toBeGreaterThan(0);
    const semDesenho = publicas.filter((s) => subjectArtKey(s) === null).map((s) => s.slug);
    expect(semDesenho).toEqual([]);
  });

  it("prefere o desenho da matéria ao da área", () => {
    expect(subjectArtKey({ slug: "logica", area: "matematica" })).toBe("logica");
    expect(subjectArtKey({ slug: "calculo", area: "matematica" })).toBe("matematica");
  });

  it("sem desenho, não desenha nada", () => {
    expect(subjectArtKey({ slug: "x", area: "outras" })).toBeNull();
    const { container } = render(<SubjectArt name={null} />);
    expect(container.innerHTML).toBe("");
  });

  it("é enfeite: o leitor de tela não o anuncia", () => {
    const { container } = render(<SubjectArt name="quimica" />);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });
});
