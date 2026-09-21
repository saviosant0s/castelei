// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Flame } from "lucide-react";
import { Callout, Card, EmptyState, ListRow, Pill, ProgressBar, Stat } from "./index";

afterEach(cleanup);

describe("Card", () => {
  it("vira link quando recebe href", () => {
    render(<Card href="/materia/portugues">Português</Card>);

    expect(screen.getByRole("link", { name: "Português" }).getAttribute("href")).toBe("/materia/portugues");
  });

  it("sem href não é clicável", () => {
    render(<Card>Só conteúdo</Card>);

    expect(screen.queryByRole("link")).toBeNull();
  });

  it("o tom escolhido vence o padrão, em vez de somar os dois", () => {
    const { container } = render(<Card tone="sky">Céu</Card>);
    const card = container.firstElementChild!;

    expect(card.className).toContain("bg-sky-soft");
    // Se o tom padrão vazasse junto, o cartão teria dois fundos disputando.
    expect(card.className).not.toContain("bg-surface-raised");
  });
});

describe("Pill", () => {
  it("troca o texto visível pelo rótulo do leitor de tela", () => {
    render(
      <Pill tone="coral" icon={Flame} label="Streak: 7 dias seguidos">
        7 dias
      </Pill>,
    );

    expect(screen.getByLabelText("Streak: 7 dias seguidos")).toBeTruthy();
  });
});

describe("ProgressBar", () => {
  it("anuncia o valor e o que está medindo", () => {
    render(<ProgressBar percent={72} label="Acerto em Funções" />);
    const bar = screen.getByRole("progressbar", { name: "Acerto em Funções" });

    expect(bar.getAttribute("aria-valuenow")).toBe("72");
  });

  it("segura valores fora da faixa em vez de vazar da barra", () => {
    render(
      <>
        <ProgressBar percent={140} label="Acima" />
        <ProgressBar percent={-20} label="Abaixo" />
      </>,
    );

    expect(screen.getByRole("progressbar", { name: "Acima" }).getAttribute("aria-valuenow")).toBe("100");
    expect(screen.getByRole("progressbar", { name: "Abaixo" }).getAttribute("aria-valuenow")).toBe("0");
  });
});

describe("Stat", () => {
  it("anuncia o rótulo antes do número", () => {
    const { container } = render(<Stat label="Tempo médio por questão" value="38s" />);

    // O leitor de tela lê na ordem do DOM: rótulo primeiro, senão o número vem solto.
    expect(container.textContent?.indexOf("Tempo médio")).toBeLessThan(container.textContent!.indexOf("38s"));
  });
});

describe("ListRow", () => {
  it("leva o título, o apoio e o selo para dentro do link", () => {
    render(<ListRow href="/licao/5" leading={5} title="O que é um sistema operacional?" meta="5 questões" />);
    const link = screen.getByRole("link");

    expect(link.getAttribute("href")).toBe("/licao/5");
    expect(link.textContent).toContain("O que é um sistema operacional?");
    expect(link.textContent).toContain("5 questões");
  });
});

describe("Callout", () => {
  it("o papel bloqueado usa borda tracejada", () => {
    const { container } = render(<Callout role="bloqueado">Faz parte do plano Pro.</Callout>);

    expect(container.firstElementChild!.className).toContain("border-dashed");
  });
});

describe("EmptyState", () => {
  it("nunca deixa a pessoa sem saída", () => {
    render(
      <EmptyState
        title="Progresso"
        description="Termine uma prática para ver seus números."
        action={{ label: "Fazer minha primeira lição", href: "/inicio" }}
      />,
    );

    expect(screen.getByRole("link", { name: "Fazer minha primeira lição" })).toBeTruthy();
  });

  it("desce para h2 quando a tela já tem um título acima", () => {
    render(<EmptyState level="h2" title="Nenhuma conquista ainda" description="Pratique para começar." />);

    // Dentro das abas do progresso o h1 é "Progresso": dois h1 quebram a leitura por títulos.
    expect(screen.getByRole("heading", { level: 2, name: "Nenhuma conquista ainda" })).toBeTruthy();
  });
});
