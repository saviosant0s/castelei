// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SubjectTrail } from "./SubjectTrail";
import { buildTrail, stars } from "@/lib/lesson-trail";
import type { LessonSummary } from "@/lib/types";

afterEach(cleanup);

function licao(position: number, module: string | null, attempts = 0): LessonSummary {
  return {
    id: position,
    title: `Lição ${position}`,
    position,
    module,
    questions_total: 8,
    questions_available: 8,
    attempts,
    best_percent: attempts > 0 ? 70 : null,
  };
}

const materia = [
  licao(1, "Fundamentos", 1),
  licao(2, "Fundamentos", 1),
  licao(3, "Processos"),
  licao(4, "Processos"),
  licao(5, "Memória"),
];

describe("SubjectTrail", () => {
  it("mostra cada módulo com número, nome e quanto já andou", () => {
    render(<SubjectTrail lessons={materia} />);

    expect(screen.getByText("Módulo 1")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Fundamentos" })).toBeTruthy();
    expect(screen.getByText("2/2")).toBeTruthy();
    expect(screen.getByText("0/2")).toBeTruthy();
  });

  it("o estado de cada lição vai no rótulo, não só na cor", () => {
    render(<SubjectTrail lessons={materia} />);

    expect(screen.getByLabelText("Lição 1: Lição 1 — concluída, 2 de 3 estrelas")).toBeTruthy();
    expect(screen.getByLabelText("Lição 3: Lição 3 — é a próxima")).toBeTruthy();
    expect(screen.getByLabelText("Lição 5: Lição 5 — ainda não praticada")).toBeTruthy();
  });

  it("dá cores diferentes a módulos vizinhos", () => {
    // A cor diz MÓDULO, não estado — é ela que faz rolar a matéria parecer
    // atravessar territórios. Vizinhos iguais desfariam o efeito.
    const trilha = buildTrail(materia);

    expect(trilha.map((m) => m.accent)).toEqual(["sky", "sage", "coral"]);
  });

  it("fecha cada módulo com um marco, que só acende completo", () => {
    render(<SubjectTrail lessons={materia} />);

    expect(screen.getByLabelText("Fundamentos: módulo completo, 2 de 2 lições")).toBeTruthy();
    expect(screen.getByLabelText("Processos: faltam 2 lições para completar")).toBeTruthy();
  });

  it("o marco concorda o verbo com o número", () => {
    // "Faltam 1 lição" não existe.
    render(<SubjectTrail lessons={[licao(1, "Memória", 1), licao(2, "Memória")]} />);

    expect(screen.getByText("Falta 1 lição")).toBeTruthy();
  });

  it("terminar já vale uma estrela, e a nota decide as outras duas", () => {
    // A trilha não cobra nota: quem tirou 40% concluiu. As estrelas convidam
    // a voltar, nunca dizem que não acabou.
    expect(stars(null)).toBe(1);
    expect(stars(40)).toBe(1);
    expect(stars(70)).toBe(2);
    expect(stars(90)).toBe(3);
    expect(stars(100)).toBe(3);
  });

  it("toda lição continua clicável, inclusive a que ainda não chegou", () => {
    render(<SubjectTrail lessons={materia} />);

    // O cinza orienta, não tranca: quem revisa na véspera da prova não pode
    // esbarrar num cadeado por ter pulado uma lição de setembro.
    for (const id of [1, 3, 5]) {
      const no = screen.getByLabelText(new RegExp(`^Lição ${id}:`));
      expect(no.getAttribute("href")).toBe(`/licao/${id}`);
    }
  });

  it("o módulo que ainda não começou aparece apagado, mas inteiro na tela", () => {
    render(<SubjectTrail lessons={materia} />);

    const adiante = screen.getByLabelText("Módulo 3: Memória");

    expect(adiante.querySelector(".opacity-75")).toBeTruthy();
    expect(screen.getByLabelText(/^Lição 5:/)).toBeTruthy();
  });

  it("matéria sem módulos vira uma trilha só, sem cabeçalho", () => {
    render(<SubjectTrail lessons={[licao(1, null), licao(2, null)]} />);

    expect(screen.queryByText(/^Módulo/)).toBeNull();
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});
