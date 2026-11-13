import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CACHE_PAGINAS, paginasDaMateria } from "@/lib/offline";

describe("offline", () => {
  it("monta as páginas da matéria", () => {
    expect(paginasDaMateria("so", [3, 4], true)).toEqual(["/materia/so", "/materia/so/vocabulario", "/licao/3", "/licao/3/ler", "/licao/4", "/licao/4/ler"]);
    expect(paginasDaMateria("so", [3], false)).toEqual(["/materia/so", "/licao/3", "/licao/3/ler"]);
    expect(paginasDaMateria("so", [3], false, "informatica")).toEqual(["/area/informatica", "/materia/so", "/licao/3", "/licao/3/ler"]);
  });

  it("usa o mesmo nome de cache que o service worker", () => {
    // Se os dois divergirem, "sair da conta" deixa as páginas da conta anterior no aparelho.
    const sw = readFileSync(resolve(__dirname, "../../public/sw.js"), "utf8");
    expect(sw).toContain(`const PAGINAS = "${CACHE_PAGINAS}";`);
  });

  it("o service worker lê a mesma marca de sessão que o proxy escreve", async () => {
    const { SESSAO_HEADER } = await import("@/proxy");
    const sw = readFileSync(resolve(__dirname, "../../public/sw.js"), "utf8");
    expect(sw).toContain(`const SESSAO_HEADER = "${SESSAO_HEADER}";`);
    expect(sw).toContain("conferirSessao(response)");
  });

  it("o service worker só guarda telas de ler, nunca a prática", () => {
    const sw = readFileSync(resolve(__dirname, "../../public/sw.js"), "utf8");
    const padrao = new RegExp(sw.match(/const GUARDAVEL = \/(.+)\/;/)![1]);
    expect(padrao.test("/licao/12")).toBe(true);
    expect(padrao.test("/licao/12/ler")).toBe(true);
    expect(padrao.test("/materia/sistemas-operacionais")).toBe(true);
    expect(padrao.test("/area/informatica")).toBe(true);
    expect(padrao.test("/trilha/llms-do-zero")).toBe(true);
    expect(padrao.test("/licao/12/praticar")).toBe(false);
    expect(padrao.test("/perfil")).toBe(false);
    expect(padrao.test("/admin")).toBe(false);
  });
});
