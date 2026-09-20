// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LessonStepper } from "./LessonStepper";
import type { LessonDetail } from "@/lib/types";

const lesson: LessonDetail = {
  id: 7,
  title: "Equações do 1º grau",
  summary: "Resumo",
  subject: { id: 1, slug: "matematica-basica", name: "Matemática Básica" },
  questions_total: 8,
  questions_available: 5,
  limited_by_plan: true,
  steps: [
    { kind: "idea", title: "Uma balança em equilíbrio", body: ["Imagine uma balança."], terms: [{ word: "Equação", meaning: "uma conta com um valor escondido." }] },
    { kind: "explain", title: "Da história para a conta", body: ["Você comprou 3 pizzas."], example: { label: "Traduzindo", lines: ["3 · x + 7 = 22", "3x + 7 = 22"] } },
    { kind: "exam", title: "Como cai na prova", body: ["A prova pede o valor de x."], bullets: ["esqueceu de trocar o sinal"] },
    { kind: "recap", title: "Resumo em 1 minuto", body: ["Mexa nos dois lados do mesmo jeito."] },
  ],
};


window.scrollTo = vi.fn() as unknown as typeof window.scrollTo; // o jsdom não implementa scrollTo
afterEach(cleanup);

describe("LessonStepper", () => {
  it("começa na primeira etapa, com a palavra nova em destaque e sem botão de voltar", () => {
    render(<LessonStepper lesson={lesson} />);

    expect(screen.getByRole("heading", { name: "Uma balança em equilíbrio" })).toBeTruthy();
    expect(screen.getByText("Etapa 1 de 4")).toBeTruthy();
    expect(screen.getByText("Palavra nova")).toBeTruthy();
    expect(screen.getByText(/uma conta com um valor escondido/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /voltar/i })).toBeNull();
    expect(screen.queryByText(/Praticar/)).toBeNull();
  });

  it("avança uma etapa por vez e mostra o exemplo resolvido", async () => {
    const user = userEvent.setup();
    render(<LessonStepper lesson={lesson} />);

    await user.click(screen.getByRole("button", { name: /continuar/i }));

    expect(screen.getByRole("heading", { name: "Da história para a conta" })).toBeTruthy();
    expect(screen.getByText("Etapa 2 de 4")).toBeTruthy();
    expect(screen.getByText("Traduzindo")).toBeTruthy();
    expect(screen.getByText("3x + 7 = 22")).toBeTruthy();
    // a etapa anterior sumiu da tela
    expect(screen.queryByRole("heading", { name: "Uma balança em equilíbrio" })).toBeNull();
  });

  it("volta para a etapa anterior", async () => {
    const user = userEvent.setup();
    render(<LessonStepper lesson={lesson} />);

    await user.click(screen.getByRole("button", { name: /continuar/i }));
    await user.click(screen.getByRole("button", { name: /voltar para a etapa anterior/i }));

    expect(screen.getByText("Etapa 1 de 4")).toBeTruthy();
  });

  it("na última etapa troca Continuar por Praticar, com o número de questões do plano", async () => {
    const user = userEvent.setup();
    render(<LessonStepper lesson={lesson} />);

    for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: /continuar/i }));

    expect(screen.getByRole("heading", { name: "Resumo em 1 minuto" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /continuar/i })).toBeNull();
    const practice = screen.getByRole("link", { name: /Praticar 5 questões/ });
    expect(practice.getAttribute("href")).toBe("/licao/7/praticar");
    expect(screen.getByText(/Plano grátis: 5 de 8 questões/)).toBeTruthy();
  });

  it("aceita as setas do teclado", async () => {
    const user = userEvent.setup();
    render(<LessonStepper lesson={lesson} />);

    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByText("Etapa 3 de 4")).toBeTruthy();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByText("Etapa 2 de 4")).toBeTruthy();
  });

  it("não passa da última nem antes da primeira etapa", async () => {
    const user = userEvent.setup();
    render(<LessonStepper lesson={lesson} />);

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByText("Etapa 1 de 4")).toBeTruthy();
    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}");
    expect(screen.getByText("Etapa 4 de 4")).toBeTruthy();
  });

  it("dá acesso direto às questões e sai da lição", () => {
    render(<LessonStepper lesson={lesson} />);

    expect(screen.getByRole("link", { name: "Ir às questões" }).getAttribute("href")).toBe("/licao/7/praticar");
    expect(screen.getByRole("link", { name: /Sair da lição/ }).getAttribute("href")).toBe("/materia/matematica-basica");
  });

  it("mostra os itens da lista na etapa de prova", async () => {
    const user = userEvent.setup();
    render(<LessonStepper lesson={lesson} />);

    await user.keyboard("{ArrowRight}{ArrowRight}");

    expect(screen.getByText("esqueceu de trocar o sinal")).toBeTruthy();
  });
});
