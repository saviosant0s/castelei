/*
| Qual tema o app usa: o do aparelho, ou um escolhido à mão.
|
| O padrão é "automático", e isso é decisão: quem já pôs o celular no escuro
| não devia precisar repetir a escolha aqui. O controle no Perfil existe para
| quem quer o contrário do aparelho — ler no escuro de dia, por exemplo.
|
| Como isso vira cor: o `globals.css` redefine os tokens em dois seletores.
| `@media (prefers-color-scheme: dark)` atende o automático, e
| `:root[data-theme="dark"]` atende a escolha manual. O `data-theme="light"`
| existe só para uma coisa — vencer um aparelho no escuro quando a pessoa
| pediu claro. Por isso o modo automático APAGA o atributo em vez de escrever
| "auto": sem atributo, quem manda é o aparelho.
*/
export type Theme = "auto" | "light" | "dark";

export const THEMES: Theme[] = ["auto", "light", "dark"];

export const THEME_KEY = "castelei:tema";

/** A cor da barra de status do sistema, por tema. Tem de casar com --color-surface. */
export const THEME_COLOR = { light: "#F8F9FA", dark: "#14141F" } as const;

export function isTheme(value: unknown): value is Theme {
  return value === "auto" || value === "light" || value === "dark";
}

export function readTheme(): Theme {
  try {
    const guardado = window.localStorage.getItem(THEME_KEY);

    return isTheme(guardado) ? guardado : "auto";
  } catch {
    // Aba anônima ou dados de site bloqueados: o aparelho decide.
    return "auto";
  }
}

/** O tema que vale na prática agora — resolve "auto" contra o aparelho. */
export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme !== "auto") return theme;

  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

/**
 * Põe o tema na página. Mexe em três lugares, e os três importam:
 * o atributo (que troca os tokens), o `color-scheme` do navegador (campos,
 * menus e barra de rolagem do sistema) e a cor da barra de status.
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;

  if (theme === "auto") {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = theme;
  }

  const efetivo = resolveTheme(theme);

  /*
  | A barra de status do celular.
  |
  | São DUAS metas no HTML, uma por media query, e as duas recebem a mesma
  | cor aqui. Escrever só na primeira não bastava: quem força claro num
  | celular escuro continua casando com a meta de escuro, e ficava com a
  | barra de status escura em cima de uma tela clara.
  */
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute("content", THEME_COLOR[efetivo]));
}

/*
| O evento que avisa a própria aba.
|
| O `storage` do navegador só dispara nas OUTRAS abas. Sem este aviso, o
| controle no Perfil trocaria a cor da tela mas continuaria mostrando o botão
| antigo marcado, porque nada diria a ele que o valor mudou.
*/
const THEME_EVENT = "castelei:tema-mudou";

export function saveTheme(theme: Theme): void {
  try {
    if (theme === "auto") {
      window.localStorage.removeItem(THEME_KEY);
    } else {
      window.localStorage.setItem(THEME_KEY, theme);
    }
  } catch {
    // Sem armazenamento, a escolha vale só nesta visita.
  }

  window.dispatchEvent(new Event(THEME_EVENT));
}

/** Para o `useSyncExternalStore`: cobre esta aba e as outras. */
export function subscribeTheme(onChange: () => void): () => void {
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * O que roda antes da primeira pintura, no `<head>`.
 *
 * Precisa ser texto, e não um componente: se a escolha só chegasse depois da
 * hidratação, quem pediu escuro veria a tela clara piscar antes. É a única
 * razão de existir um script embutido no app.
 */
export const THEME_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t==="dark"||t==="light"){document.documentElement.dataset.theme=t}}catch(e){}`;
