// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ReviewList, ReviewRow } from "@/components/review/ReviewRow";
import type { ReviewItem } from "@/lib/types";

afterEach(cleanup);

function item(extra: Partial<ReviewItem> = {}): ReviewItem {
  return {
    lesson_id: 7,
    lesson_title: "Escalonamento",
    subject_name: "Sistemas Operacionais",
    subject_slug: "sistemas-operacionais",
    due_at: "2026-10-01T12:00:00-03:00",
    days_late: 0,
    last_percent: 70,
    interval_days: 13,
    days_to_exam: 90,
    ...extra,
  };
}

describe("ReviewRow", () => {
  it("leva para a lição", () => {
    render(<ul><ReviewRow item={item()} /></ul>);

    expect(screen.getByRole("link").getAttribute("href")).toBe("/licao/7");
  });

  it("mostra matéria, prazo e a última nota", () => {
    render(<ul><ReviewRow item={item({ days_late: 2, last_percent: 60 })} /></ul>);

    expect(screen.getByText("Sistemas Operacionais")).toBeTruthy();
    expect(screen.getByText(/Atrasada 2 dias/)).toBeTruthy();
    expect(screen.getByText(/60%/)).toBeTruthy();
  });

  it("não inventa nota quando a lição nunca foi pontuada", () => {
    render(<ul><ReviewRow item={item({ last_percent: null })} /></ul>);

    expect(screen.queryByText(/da última vez/)).toBeNull();
  });

  /* Lição apagada pelo painel não pode virar link para /licao/null. */
  it("some quando a lição não existe mais", () => {
    const { container } = render(<ul><ReviewRow item={item({ lesson_id: null })} /></ul>);

    expect(container.querySelector("a")).toBeNull();
  });
});

describe("ReviewList", () => {
  const tres = [
    item({ lesson_id: 1, lesson_title: "Uma" }),
    item({ lesson_id: 2, lesson_title: "Duas" }),
    item({ lesson_id: 3, lesson_title: "Três" }),
  ];

  it("mostra tudo quando não há limite", () => {
    render(<ReviewList itens={tres} />);

    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("corta no limite e oferece o resto", () => {
    render(<ReviewList itens={tres} limite={2} />);

    expect(screen.getByText("Uma")).toBeTruthy();
    expect(screen.queryByText("Três")).toBeNull();
    expect(screen.getByRole("link", { name: /Ver mais 1/ }).getAttribute("href")).toBe("/revisar");
  });

  it("não oferece 'ver mais' quando cabe tudo", () => {
    render(<ReviewList itens={tres} limite={5} />);

    expect(screen.queryByText(/Ver /)).toBeNull();
  });
});
