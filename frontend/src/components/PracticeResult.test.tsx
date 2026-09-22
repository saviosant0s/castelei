// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ResultView } from "./PracticeClient";
import type { FinishResult } from "@/lib/types";

afterEach(cleanup);

const base: FinishResult = {
  attempt_id: 1,
  kind: "lesson",
  lesson_id: 7,
  subject_id: 2,
  total: 8,
  correct: 8,
  percent: 100,
  avg_seconds: 24,
  previous_best_avg_seconds: null,
  is_record: false,
  weak_topic: null,
  next_lesson: { id: 8, title: "Estrutura de um SO: como ele é montado por dentro" },
  limited_by_plan: false,
  gamification: {
    xp_earned: 160,
    xp_total: 800,
    streak: { current: 3, longest: 3, studied_today: true },
    new_badges: [],
  },
};

const fonte = { kind: "lesson", lessonId: 7, lessonTitle: "Processos" } as const;

function montar(result: Partial<FinishResult> = {}) {
  return render(<ResultView result={{ ...base, ...result }} source={fonte} onRetry={() => {}} />);
}

describe("tela de resultado", () => {
  it("o que fazer em seguida não depende de rolar a tela", () => {
    /*
    | A queixa que desenhou esta tela: os botões ficavam no fim de uma
    | rolagem. A barra é fixa, como a de "Confirmar" durante a prática — se
    | alguém tirar o `fixed` daqui, o botão volta a fugir para baixo do
    | conteúdo sem que nada quebre visivelmente em jsdom.
    */
    const { container } = montar();

    const seguir = screen.getByRole("link", { name: /Continuar/ });
    const barra = seguir.closest("div.fixed");

    expect(barra).not.toBeNull();
    expect(barra?.className).toContain("bottom-0");
    // E o conteúdo reserva espaço para ela, senão o fim da tela fica coberto.
    expect(container.firstElementChild?.className).toContain("pb-44");
  });

  it("o apoio é uma faixa de colunas, não uma pilha de cartões", () => {
    // Tempo, XP e sequência numa linha só. Empilhados, eram três telas.
    montar();

    const faixa = screen.getByText("Por questão").closest("dl");

    expect(faixa?.className).toContain("flex");
    expect(faixa?.querySelectorAll("dt")).toHaveLength(3);
    expect(screen.getByText("+160")).toBeTruthy();
    expect(screen.getByText("3 dias")).toBeTruthy();
  });

  it("a coluna some quando o dado não existe, em vez de mostrar traço", () => {
    montar({ avg_seconds: null, gamification: null });

    expect(screen.queryByText("Por questão")).toBeNull();
    expect(screen.queryByRole("definition")).toBeNull();
  });

  it("sobre o tempo, uma frase só", () => {
    /*
    | Recorde novo, recorde a bater ou o convite da primeira vez — nunca os
    | três. Três frases de tempo era metade da rolagem.
    */
    const { unmount } = montar({ is_record: true, previous_best_avg_seconds: 30, avg_seconds: 24 });
    expect(screen.getByText(/Novo recorde/)).toBeTruthy();
    expect(screen.queryByText(/bater na próxima vez/)).toBeNull();
    unmount();

    montar({ previous_best_avg_seconds: 20 });
    expect(screen.getByText(/Seu recorde continua/)).toBeTruthy();
  });

  it("sem próxima lição, praticar de novo vira o botão principal", () => {
    montar({ next_lesson: null });

    expect(screen.queryByRole("link", { name: /Continuar/ })).toBeNull();
    expect(screen.getByRole("button", { name: /Praticar esta lição de novo/ }).className).toContain("btn-primary");
  });
});
