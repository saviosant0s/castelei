// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { NoteReview } from "./NoteReview";

afterEach(cleanup);

describe("NoteReview", () => {
  it("mostra as partes com conteúdo e esconde a vazia", () => {
    render(<NoteReview review={{ right: ["Contador certo."], wrong: [], missing: ["O down e o up."] }} remaining={4} />);
    expect(screen.getByText("O que você acertou")).toBeTruthy();
    expect(screen.queryByText("O que corrigir")).toBeNull();
    expect(screen.getByText("O down e o up.")).toBeTruthy();
    expect(screen.getByText("Ainda dá para corrigir 4 vezes hoje.")).toBeTruthy();
  });

  it("avisa quando foi a última do dia", () => {
    render(<NoteReview review={{ right: ["x"], wrong: [], missing: [] }} remaining={0} />);
    expect(screen.getByText("Essa foi a última correção de hoje.")).toBeTruthy();
  });
});
