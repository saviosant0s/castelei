// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SubjectSummary } from "./SubjectSummary";
import type { LessonSummary } from "@/lib/types";

afterEach(cleanup);

function licao(position: number, attempts = 0): LessonSummary {
  return {
    id: position,
    title: `Lição ${position}`,
    position,
    module: "Fundamentos",
    questions_total: 8,
    questions_available: 8,
    attempts,
    best_percent: attempts > 0 ? 70 : null,
  };
}

const materia = [licao(1, 1), licao(2, 1), licao(3), licao(4)];

describe("SubjectSummary", () => {
  it("diz quanto falta para a prova e quanto do caminho já andou", () => {
    render(<SubjectSummary lessons={materia} examDate="9999-12-15" />);

    expect(screen.getByText(/para a prova/)).toBeTruthy();
    expect(screen.getByText("15 de dezembro", { exact: false })).toBeTruthy();
    expect(screen.getByText("2/4")).toBeTruthy();
  });

  it("matéria sem data de prova mostra só o progresso, sem inventar prazo", () => {
    render(<SubjectSummary lessons={materia} examDate={null} />);

    expect(screen.queryByText(/prova/)).toBeNull();
    expect(screen.getByText("2/4")).toBeTruthy();
  });

  it("a barra diz o que mede, para quem não enxerga a barra", () => {
    render(<SubjectSummary lessons={materia} examDate={null} />);

    expect(screen.getByRole("progressbar").getAttribute("aria-label")).toBe(
      "2 de 4 lições praticadas nesta matéria",
    );
  });

  it("matéria vazia não vira uma barra de 0/0", () => {
    const { container } = render(<SubjectSummary lessons={[]} examDate={null} />);

    expect(container.firstChild).toBeNull();
  });
});
