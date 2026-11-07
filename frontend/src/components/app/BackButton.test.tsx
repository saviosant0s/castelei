// @vitest-environment jsdom
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AppBar } from "./AppBar";
import { BackButton } from "./BackButton";

vi.mock("next/navigation", () => ({ usePathname: () => "/inicio", useRouter: () => ({ refresh: vi.fn() }) }));

afterEach(cleanup);

const APP = path.resolve(import.meta.dirname, "../../app/(app)");
const SLOT = path.join(APP, "@voltar");

/** As telas de uma pasta, como caminho relativo da pasta da página ("" é a raiz). */
function telas(raiz: string, pasta = ""): string[] {
  const aqui = path.join(raiz, pasta);
  return readdirSync(aqui).flatMap((nome) => {
    const caminho = path.join(pasta, nome);
    if (nome.startsWith("@")) return [];
    if (statSync(path.join(raiz, caminho)).isDirectory()) return telas(raiz, caminho);
    return nome === "page.tsx" ? [pasta] : [];
  });
}

describe("voltar do cabeçalho", () => {
  it("diz para onde leva e marca o lugar do selo", () => {
    render(<BackButton href="/area/matematica" label="Matemática" />);
    const link = screen.getByRole("link", { name: "Voltar para Matemática" });
    expect(link.getAttribute("href")).toBe("/area/matematica");
    expect(link.hasAttribute("data-voltar")).toBe(true);
  });

  it("vai no cabeçalho junto do selo, que o CSS esconde quando há voltar", () => {
    render(<AppBar bar={{ gamification: null, area: { slug: "matematica", name: "Matemática" }, reviews_due: 0 }} voltar={<BackButton href="/inicio" label="Início" />} />);
    const selo = screen.getByRole("link", { name: "Estudando Matemática" });
    expect(screen.getByRole("link", { name: "Voltar para Início" })).toBeTruthy();
    expect(selo.parentElement?.className).toContain("group-has-[[data-voltar]]/bar:hidden");
  });

  /*
  | Sem espelho no slot, a troca de tela sem recarregar mantém a última página
  | do `@voltar`: o "voltar" da matéria ficaria no cabeçalho da tela nova.
  */
  it("toda tela do app tem a sua página no slot @voltar", () => {
    const semEspelho = telas(APP).filter((tela) => !telas(SLOT).includes(tela));
    expect(semEspelho).toEqual([]);
  });
});
