// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { StepTable, tabelaCompacta } from "./StepTable";

afterEach(cleanup);

const tabela = {
  label: "O mesmo comando nos dois sistemas",
  headers: ["O que faz", "Linux", "Windows"],
  rows: [
    ["Lista os arquivos", "ls -la", "Get-ChildItem"],
    ["Mostra a pasta atual", "pwd", "Get-Location"],
  ],
  mono: true,
};

describe("StepTable", () => {
  it("mostra cabeçalhos e linhas", () => {
    render(<StepTable table={tabela} />);

    expect(screen.getByText("O mesmo comando nos dois sistemas")).toBeTruthy();
    expect(screen.getAllByRole("columnheader")).toHaveLength(3);
    expect(screen.getByText("Get-Location")).toBeTruthy();
  });

  it("a primeira coluna não vira fonte de código, mesmo em tabela de comandos", () => {
    // A primeira coluna é a frase que explica o que o comando faz. Em mono ela
    // ficaria ilegível, e a tabela perderia justamente a parte em português.
    render(<StepTable table={tabela} />);

    expect(screen.getByText("Lista os arquivos").className).not.toContain("font-mono");
    expect(screen.getByText("ls -la").className).toContain("font-mono");
  });

  it("sem nada escondido, não existe aviso de arrastar", () => {
    /*
    | Em jsdom nada tem largura, então a medida dá "cabe inteira" — que é
    | exatamente o caso que este teste tranca. O aviso e a sombra são MEDIDOS,
    | não fixos: sombra permanente numa tabela que cabe seria mentira, e a
    | pessoa aprenderia a ignorar as duas.
    */
    render(<StepTable table={tabela} />);

    expect(screen.queryByText(/Arraste a tabela/)).toBeNull();
  });

  it("a tabela rola para o lado em vez de espremer as colunas", () => {
    // Sem a caixa de rolagem, três colunas num celular de 390px cortam a
    // última no meio de uma palavra — e quem lê acha que o conteúdo quebrou.
    const { container } = render(<StepTable table={tabela} />);

    expect(container.querySelector("table")!.parentElement!.className).toContain("overflow-x-auto");
  });

  it("tabela de células curtas não ganha largura mínima, e a de frases ganha", () => {
    // A dos ângulos notáveis cabe inteira num celular: forçar 26rem escondia a
    // coluna de 60° atrás da rolagem.
    const notaveis = {
      label: "Os ângulos notáveis",
      headers: ["", "30°", "45°", "60°"],
      rows: [
        ["seno", "1/2", "√2/2", "√3/2"],
        ["cosseno", "√3/2", "√2/2", "1/2"],
        ["tangente", "√3/3", "1", "√3"],
      ],
    };
    expect(tabelaCompacta(notaveis)).toBe(true);
    expect(tabelaCompacta(tabela)).toBe(false);

    const { container } = render(<StepTable table={notaveis} />);
    expect(container.querySelector("table")!.className).not.toContain("min-w-");
    cleanup();

    const { container: outra } = render(<StepTable table={tabela} />);
    expect(outra.querySelector("table")!.className).toContain("min-w-[26rem]");
  });
});
