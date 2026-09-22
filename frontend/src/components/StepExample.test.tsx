// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { StepExample } from "./StepExample";

afterEach(cleanup);

describe("bloco de exemplo", () => {
  it("lista comum continua em fonte de máquina, sem número", () => {
    const { container } = render(
      <StepExample example={{ label: "Os quatro pedidos", lines: ["open: abre", "read: lê"] }} />,
    );

    expect(container.querySelector("ol")?.className).toContain("font-mono");
    expect(screen.queryByText("1")).toBeNull();
  });

  it("sequência vira escada numerada, em texto normal", () => {
    /*
    | O bloco fazia dois trabalhos com a mesma cara: lista de coisas e
    | sequência de passos. A sequência perdia justo o que tinha de mais
    | importante — a ordem.
    */
    const { container } = render(
      <StepExample
        example={{ label: "Salvar um arquivo", lines: ["o programa pede", "o SO grava"], ordered: true }}
      />,
    );

    expect(container.querySelector("ol")?.className).not.toContain("font-mono");
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("o último passo não puxa traço para lugar nenhum", () => {
    const { container } = render(
      <StepExample example={{ label: "Dois passos", lines: ["um", "dois"], ordered: true }} />,
    );

    // Um traço só: entre o primeiro e o segundo.
    expect(container.querySelectorAll("span[aria-hidden]")).toHaveLength(1);
  });
});
