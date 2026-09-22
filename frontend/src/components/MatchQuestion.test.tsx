// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MatchQuestion } from "./MatchQuestion";

afterEach(cleanup);

const prompts = ["open", "read", "close"];
const options = ["ReadFile", "CloseHandle", "CreateFile"];
const certos = [
  { left: "open", right: "CreateFile" },
  { left: "read", right: "ReadFile" },
  { left: "close", right: "CloseHandle" },
];

describe("questão de associar", () => {
  it("a resposta escolhida cai na primeira vaga livre", () => {
    const onChange = vi.fn();
    render(
      <MatchQuestion
        prompts={prompts}
        options={options}
        matching={[null, null, null]}
        onChange={onChange}
        disabled={false}
        correctPairs={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "CloseHandle" }));

    expect(onChange).toHaveBeenCalledWith([1, null, null]);
  });

  it("a resposta já usada sai do banco de baixo", () => {
    render(
      <MatchQuestion
        prompts={prompts}
        options={options}
        matching={[2, null, null]}
        onChange={vi.fn()}
        disabled={false}
        correctPairs={null}
      />,
    );

    // "CreateFile" está ligado ao open; não pode aparecer de novo para escolher.
    expect(screen.queryByRole("button", { name: "CreateFile" })).toBeNull();
    expect(screen.getByRole("button", { name: /open: CreateFile/ })).toBeTruthy();
  });

  it("errar mostra o par certo em texto normal, e o erro embaixo", () => {
    /*
    | A primeira versão punha um X vermelho ao lado da resposta CERTA, e lia-se
    | como "esta é a errada" — justo a linha que existe para ensinar.
    */
    render(
      <MatchQuestion
        prompts={prompts}
        options={options}
        matching={[1, 0, 2]}
        onChange={vi.fn()}
        disabled
        correctPairs={certos}
      />,
    );

    expect(screen.getByText("Você ligou com CloseHandle.")).toBeTruthy();
    // O par certo continua visível, sem marca de erro em cima dele.
    expect(screen.getByText("CreateFile")).toBeTruthy();
    // O banco de respostas some: não há mais o que escolher.
    expect(screen.queryByRole("region", { name: "Respostas" })).toBeNull();
  });

  it("o par acertado ganha o certo verde e nenhuma correção", () => {
    render(
      <MatchQuestion
        prompts={["open"]}
        options={["CreateFile"]}
        matching={[0]}
        onChange={vi.fn()}
        disabled
        correctPairs={[{ left: "open", right: "CreateFile" }]}
      />,
    );

    expect(screen.getByRole("listitem").className).toContain("border-sage");
    expect(screen.queryByText(/Você ligou com/)).toBeNull();
  });
});
