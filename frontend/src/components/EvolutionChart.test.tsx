// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { EvolutionChart } from "./EvolutionChart";
import type { EvolutionPoint } from "@/lib/types";

function point(overrides: Partial<EvolutionPoint> & { attempt_id: number }): EvolutionPoint {
  return {
    kind: "lesson",
    title: "Equações do 1º grau",
    finished_at: "2026-09-19T12:00:00-03:00",
    percent: 60,
    avg_seconds: 40,
    ...overrides,
  };
}

afterEach(cleanup);

describe("EvolutionChart", () => {
  it("não desenha nada com menos de duas práticas", () => {
    const { container } = render(<EvolutionChart points={[point({ attempt_id: 1 })]} />);

    expect(container.firstChild).toBeNull();
  });

  it("mostra os dois gráficos, cada um com seu eixo", () => {
    render(
      <EvolutionChart
        points={[
          point({ attempt_id: 1, percent: 40, avg_seconds: 60 }),
          point({ attempt_id: 2, percent: 80, avg_seconds: 30 }),
        ]}
      />,
    );

    // Acerto e tempo nunca dividem o mesmo eixo: são duas figuras separadas.
    expect(screen.getByText("Acerto por prática")).toBeTruthy();
    expect(screen.getByText("Tempo médio por questão")).toBeTruthy();
    expect(screen.getAllByRole("img").length).toBe(2);
  });

  it("lê a medida mais recente, não a primeira", () => {
    render(
      <EvolutionChart
        points={[
          point({ attempt_id: 1, percent: 40, avg_seconds: 60 }),
          point({ attempt_id: 2, percent: 80, avg_seconds: 30 }),
        ]}
      />,
    );

    // A leitura grande de cada figura, não os valores repetidos na tabela.
    const readings = screen.getAllByRole("figure").map((figure) => figure.querySelector("figcaption")?.textContent);
    expect(readings[0]).toContain("80%");
    expect(readings[1]).toContain("30s");
  });

  it("entende que no tempo menor é melhor", () => {
    render(
      <EvolutionChart
        points={[
          point({ attempt_id: 1, percent: 50, avg_seconds: 60 }),
          point({ attempt_id: 2, percent: 50, avg_seconds: 20 }),
        ]}
      />,
    );

    expect(screen.getByText(/resolvendo mais rápido/)).toBeTruthy();
    // O acerto ficou igual, então não comenta nada sobre ele.
    expect(screen.queryByText(/acerto subiu/)).toBeNull();
    expect(screen.queryByText(/acerto caiu/)).toBeNull();
  });

  it("avisa quando o acerto caiu", () => {
    render(
      <EvolutionChart
        points={[
          point({ attempt_id: 1, percent: 90 }),
          point({ attempt_id: 2, percent: 50 }),
        ]}
      />,
    );

    expect(screen.getByText(/acerto caiu/)).toBeTruthy();
  });

  it("traz a tabela com os números, da prática mais recente para a mais antiga", () => {
    render(
      <EvolutionChart
        points={[
          point({ attempt_id: 1, title: "Primeira", percent: 40, avg_seconds: 60 }),
          point({ attempt_id: 2, title: "Simulado — Português", kind: "exam", percent: 80, avg_seconds: 30 }),
        ]}
      />,
    );

    const rows = screen.getAllByRole("row").slice(1); // fora o cabeçalho
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain("Simulado — Português");
    expect(rows[1].textContent).toContain("Primeira");
  });

  it("aceita prática sem tempo médio", () => {
    render(
      <EvolutionChart
        points={[
          point({ attempt_id: 1, avg_seconds: null }),
          point({ attempt_id: 2, avg_seconds: null }),
        ]}
      />,
    );

    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});
