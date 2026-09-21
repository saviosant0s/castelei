// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  THEME_COLOR,
  THEME_KEY,
  THEME_SCRIPT,
  type Theme,
  applyTheme,
  isTheme,
  readTheme,
  resolveTheme,
  saveTheme,
  subscribeTheme,
} from "./theme";

/** O `matchMedia` do jsdom não existe: cada teste diz qual é o tema do aparelho. */
function aparelho(escuro: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: escuro && query.includes("dark"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
}

beforeEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
  // As duas metas do HTML de verdade, uma por media query.
  document.head.innerHTML =
    '<meta name="theme-color" media="(prefers-color-scheme: light)" content="#F8F9FA">' +
    '<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#14141F">';
  aparelho(false);
});

afterEach(() => vi.unstubAllGlobals());

/** Todas as metas, porque é justamente isso que já deu errado uma vez. */
const metas = () =>
  [...document.querySelectorAll('meta[name="theme-color"]')].map((m) => m.getAttribute("content"));

const meta = () => metas()[0];

describe("leitura e gravação", () => {
  it("sem nada guardado, o aparelho manda", () => {
    expect(readTheme()).toBe("auto");
  });

  it("guarda e lê a escolha", () => {
    saveTheme("dark");
    expect(window.localStorage.getItem(THEME_KEY)).toBe("dark");
    expect(readTheme()).toBe("dark");
  });

  it("automático APAGA a chave em vez de escrever 'auto'", () => {
    // Sem atributo é o que devolve a decisão ao aparelho. Gravar "auto"
    // deixaria um valor que o script do <head> teria de saber ignorar.
    saveTheme("dark");
    saveTheme("auto");
    expect(window.localStorage.getItem(THEME_KEY)).toBeNull();
  });

  it("valor estragado no armazenamento vira automático", () => {
    window.localStorage.setItem(THEME_KEY, "roxo");
    expect(readTheme()).toBe("auto");
  });

  it("só aceita os três temas", () => {
    expect(["auto", "light", "dark"].every(isTheme)).toBe(true);
    expect(isTheme("sepia")).toBe(false);
    expect(isTheme(null)).toBe(false);
  });
});

describe("resolver contra o aparelho", () => {
  it("automático segue o aparelho", () => {
    aparelho(true);
    expect(resolveTheme("auto")).toBe("dark");
    aparelho(false);
    expect(resolveTheme("auto")).toBe("light");
  });

  it("a escolha manual vence o aparelho", () => {
    aparelho(true);
    expect(resolveTheme("light")).toBe("light");
    aparelho(false);
    expect(resolveTheme("dark")).toBe("dark");
  });
});

describe("aplicar na página", () => {
  it("escuro escreve o atributo e acerta a barra de status", () => {
    applyTheme("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(meta()).toBe(THEME_COLOR.dark);
  });

  it("automático apaga o atributo e usa a cor do aparelho", () => {
    aparelho(true);
    applyTheme("dark");
    applyTheme("auto");
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(meta()).toBe(THEME_COLOR.dark);
  });

  it("claro num aparelho escuro deixa a barra de status clara", () => {
    // É o caso que a meta estática do HTML erraria sozinha: ela só olha o
    // aparelho, e aqui a pessoa pediu o contrário.
    aparelho(true);
    applyTheme("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(meta()).toBe(THEME_COLOR.light);
  });

  it("acerta TODAS as metas, não só a primeira", () => {
    // Com duas metas por media query, escrever só na primeira deixava quem
    // força claro num celular escuro com a barra de status escura: o
    // aparelho continuava casando com a meta de escuro.
    aparelho(true);
    applyTheme("light");
    expect(metas()).toEqual([THEME_COLOR.light, THEME_COLOR.light]);
  });
});

describe("aviso de mudança", () => {
  it("avisa a própria aba, que o evento storage não alcança", () => {
    const ouvinte = vi.fn();
    const parar = subscribeTheme(ouvinte);

    saveTheme("dark");
    expect(ouvinte).toHaveBeenCalledTimes(1);

    parar();
    saveTheme("light");
    expect(ouvinte).toHaveBeenCalledTimes(1);
  });
});

describe("o script do <head>", () => {
  it("aplica a escolha guardada antes da primeira pintura", () => {
    // Roda o script como o navegador rodaria, com a chave já gravada.
    window.localStorage.setItem(THEME_KEY, "dark");
    new Function(THEME_SCRIPT)();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("não escreve atributo nenhum quando a escolha é automática", () => {
    new Function(THEME_SCRIPT)();
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("aguenta armazenamento bloqueado sem derrubar a página", () => {
    const original = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("bloqueado");
      },
    });

    expect(() => new Function(THEME_SCRIPT)()).not.toThrow();
    expect((): Theme => readTheme()).not.toThrow();

    if (original) Object.defineProperty(window, "localStorage", original);
  });
});
