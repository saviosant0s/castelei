// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SubjectSummary } from "./SubjectSummary";
import userEvent from "@testing-library/user-event";
import type { LessonSummary } from "@/lib/types";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

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
    render(<SubjectSummary subjectId={1} lessons={materia} examDate="9999-12-15" />);

    expect(screen.getByText(/para a prova/)).toBeTruthy();
    expect(screen.getByText("15 de dezembro", { exact: false })).toBeTruthy();
    expect(screen.getByText("2/4")).toBeTruthy();
  });

  it("sem data, não inventa prazo: convida a pessoa a marcar a dela", () => {
    render(<SubjectSummary subjectId={1} lessons={materia} examDate={null} />);

    expect(screen.queryByText(/para a prova/)).toBeNull();
    expect(screen.getByRole("button", { name: "Marcar a data da prova" })).toBeTruthy();
    expect(screen.getByText("2/4")).toBeTruthy();
  });

  it("a pessoa marca a própria data, e a tela recarrega com ela", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ exam_date: "9999-12-15" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<SubjectSummary subjectId={7} lessons={materia} examDate={null} />);

    await user.click(screen.getByRole("button", { name: "Marcar a data da prova" }));
    const campo = screen.getByLabelText("Quando é a sua prova?");
    await user.type(campo, "9999-12-15");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/subjects/7/exam-date", expect.objectContaining({ method: "PUT" }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ exam_date: "9999-12-15" });
    expect(refresh).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("a barra diz o que mede, para quem não enxerga a barra", () => {
    render(<SubjectSummary subjectId={1} lessons={materia} examDate={null} />);

    expect(screen.getByRole("progressbar").getAttribute("aria-label")).toBe(
      "2 de 4 lições praticadas nesta matéria",
    );
  });

  it("matéria vazia não vira uma barra de 0/0", () => {
    const { container } = render(<SubjectSummary subjectId={1} lessons={[]} examDate={null} />);

    expect(container.firstChild).toBeNull();
  });
});
