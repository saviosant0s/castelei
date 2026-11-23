// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { IncidenceTag } from "./IncidenceTag";
import { JudgeQuestion } from "./JudgeQuestion";

afterEach(cleanup);

const resposta = (correto: number, acertou: boolean) => ({
  is_correct: acertou,
  correct_index: correto,
  correct_order: null,
  correct_pairs: null,
  explanation: "Porque a cópia vem antes.",
  pitfall: null,
});

describe("questão de certo ou errado", () => {
  it("Certo vem antes de Errado, e tocar avisa qual foi", () => {
    const onSelect = vi.fn();
    render(<JudgeQuestion selected={null} onSelect={onSelect} disabled={false} feedback={null} />);

    const botoes = screen.getAllByRole("button");
    expect(botoes.map((b) => b.textContent)).toEqual(["Certo", "Errado"]);

    fireEvent.click(screen.getByRole("button", { name: /Errado/ }));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it("depois de responder, o gabarito ganha a marca mesmo quando a pessoa errou", () => {
    render(<JudgeQuestion selected={0} onSelect={vi.fn()} disabled feedback={resposta(1, false)} />);

    expect(screen.getByRole("button", { name: /Errado/ }).textContent).toContain("gabarito");
    expect(screen.getByRole("button", { name: /Certo/ }).textContent).not.toContain("gabarito");
  });
});

describe("marca de importância", () => {
  it("diz em palavras o quanto cai", () => {
    render(<IncidenceTag incidence="alta" />);
    expect(screen.getByText("Cai muito")).toBeTruthy();
  });
});
