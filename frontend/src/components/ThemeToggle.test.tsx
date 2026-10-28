// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ThemeToggle } from "./ThemeToggle";
import { THEME_KEY } from "@/lib/theme";

beforeEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
  document.head.innerHTML = '<meta name="theme-color" content="#F8F9FA">';
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const opcao = (nome: string) => screen.getByRole("radio", { name: new RegExp(nome) });

describe("ThemeToggle", () => {
  it("começa no claro, que é o padrão", () => {
    render(<ThemeToggle />);
    expect(opcao("Claro").getAttribute("aria-checked")).toBe("true");
  });

  it("escolher escuro guarda e aplica na página", () => {
    render(<ThemeToggle />);
    fireEvent.click(opcao("Escuro"));

    expect(window.localStorage.getItem(THEME_KEY)).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(opcao("Escuro").getAttribute("aria-checked")).toBe("true");
  });

  it("voltar ao automático devolve a decisão ao aparelho", () => {
    render(<ThemeToggle />);
    fireEvent.click(opcao("Escuro"));
    fireEvent.click(opcao("Automático"));

    expect(window.localStorage.getItem(THEME_KEY)).toBe("auto");
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("voltar ao claro apaga a escolha guardada", () => {
    render(<ThemeToggle />);
    fireEvent.click(opcao("Escuro"));
    fireEvent.click(opcao("Claro"));

    expect(window.localStorage.getItem(THEME_KEY)).toBeNull();
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("mostra a escolha já guardada quando a tela abre", () => {
    window.localStorage.setItem(THEME_KEY, "dark");
    render(<ThemeToggle />);
    expect(opcao("Escuro").getAttribute("aria-checked")).toBe("true");
  });

  it("é um grupo de rádio, não três botões soltos", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("radiogroup", { name: "Tema do aplicativo" })).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });
});
