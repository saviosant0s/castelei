// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { OrderQuestion } from "./OrderQuestion";

afterEach(cleanup);

const passos = ["o pai espera", "o shell chama fork", "o filho troca de programa"];

function montar(ordering: number[] = [], onChange = vi.fn()) {
  render(
    <OrderQuestion
      options={passos}
      ordering={ordering}
      onChange={onChange}
      disabled={false}
      correctOrder={null}
    />,
  );

  return onChange;
}

describe("questão de ordenar", () => {
  it("o passo escolhido sai da lista de baixo e vira número", () => {
    montar([1]);

    // O escolhido aparece com o número 1 e não está mais entre os disponíveis.
    expect(screen.getByRole("button", { name: /Passo 1: o shell chama fork/ })).toBeTruthy();

    const disponiveis = screen.getByRole("region", { name: "Passos" });
    expect(disponiveis.textContent).not.toContain("o shell chama fork");
  });

  it("tocar de novo tira da ordem, e os outros não mudam de lugar", () => {
    /*
    | O passo devolvido volta para ONDE ESTAVA na lista de baixo, e não para o
    | fim: fila que embaralha a cada arrependimento faz perder de vista o que
    | já foi lido.
    */
    const onChange = montar([1, 0]);

    fireEvent.click(screen.getByRole("button", { name: /Passo 1: o shell chama fork/ }));

    expect(onChange).toHaveBeenCalledWith([0]);
  });

  it("sem nada escolhido, convida em vez de mostrar lista vazia", () => {
    montar([]);

    expect(screen.getByText(/Toque nos passos abaixo/)).toBeTruthy();
  });

  it("depois de responder, mostra a ordem certa com certo no que ficou no lugar", () => {
    /*
    | Só "errou" não ensina nada numa questão de ordem: o que falta saber é
    | ONDE a sequência saiu do trilho.
    */
    render(
      <OrderQuestion
        options={passos}
        // a pessoa pôs o fork primeiro (certo) e inverteu os outros dois
        ordering={[1, 0, 2]}
        onChange={vi.fn()}
        disabled
        correctOrder={["o shell chama fork", "o filho troca de programa", "o pai espera"]}
      />,
    );

    // A resposta da pessoa continua na tela, e a certa vem embaixo:
    // mostrar só a certa parecia que o app tinha trocado a ordem dela.
    const itens = screen.getAllByRole("listitem");

    expect(screen.getByText("Sua ordem")).toBeTruthy();
    expect(screen.getByText("A ordem certa")).toBeTruthy();
    expect(itens).toHaveLength(6);
    expect(itens[0].textContent).toContain(passos[1]);
    expect(itens[0].className).toContain("border-sage");
    expect(itens[1].className).toContain("border-coral");
    expect(screen.queryByText(/Toque nos passos abaixo/)).toBeNull();
  });

  it("quem acertou vê só a própria ordem, marcada como certa", () => {
    render(
      <OrderQuestion
        options={passos}
        ordering={[1, 2, 0]}
        onChange={vi.fn()}
        disabled
        correctOrder={[passos[1], passos[2], passos[0]]}
      />,
    );

    expect(screen.getByText("Sua ordem está certa")).toBeTruthy();
    expect(screen.queryByText("A ordem certa")).toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });
});
