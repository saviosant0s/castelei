// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { StepCode } from "./StepCode";

afterEach(cleanup);

describe("StepCode", () => {
  it("numera as linhas e casa cada número com uma tradução", () => {
    render(
      <StepCode
        code={{
          label: "C (Linux)",
          text: 'fd = open("notas.txt", O_RDONLY);\nclose(fd);',
          notes: ["Pede ao SO para abrir o arquivo.", "Devolve o arquivo ao SO."],
        }}
      />,
    );

    const notas = screen.getAllByRole("listitem");

    expect(notas).toHaveLength(2);
    expect(notas[0].textContent).toContain("Linha 1");
    expect(notas[0].textContent).toContain("Pede ao SO");
  });

  it("a linha em branco não ganha número", () => {
    /*
    | Ela é respiro, não instrução. Se contasse, a numeração da tela
    | discordaria da do verificador, que também a ignora — e a tradução 3
    | apontaria para a linha errada.
    */
    const { container } = render(
      <StepCode code={{ text: "down(s)\n\nup(s)", notes: ["Trava.", "Destrava."] }} />,
    );

    const gutter = [...container.querySelectorAll("[aria-hidden] div")].map((s) => s.textContent);

    expect(gutter).toEqual(["1", "\u00a0", "2"]);
  });

  it("o texto do bloco continua inteiro, com as quebras de linha", () => {
    // Quem copia o bloco leva o código, não tudo grudado numa linha só.
    const { container } = render(
      <StepCode code={{ text: "down(s)\nup(s)", notes: ["Trava.", "Destrava."] }} />,
    );

    expect(container.querySelector("pre code")?.textContent).toBe("down(s)\nup(s)");
  });

  it("sem tradução, o código aparece sem numeração", () => {
    // Numerar sem lista embaixo é enfeite: o número não aponta para nada.
    const { container } = render(<StepCode code={{ text: "wsl --install" }} />);

    expect(container.querySelectorAll("[aria-hidden]")).toHaveLength(0);
    expect(screen.queryByRole("list")).toBeNull();
  });
});
