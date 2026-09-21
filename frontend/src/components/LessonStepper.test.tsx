// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LessonStepper } from "./LessonStepper";
import type { LessonDetail } from "@/lib/types";

const lesson: LessonDetail = {
  id: 7,
  title: "Equações do 1º grau",
  summary: "Resumo",
  subject: { id: 1, slug: "matematica-basica", name: "Matemática Básica" },
  questions_total: 8,
  questions_available: 5,
  limited_by_plan: true,
  steps: [
    { kind: "idea", title: "Uma balança em equilíbrio", body: ["Imagine uma balança."], terms: [{ word: "Equação", meaning: "uma conta com um valor escondido." }] },
    { kind: "explain", title: "Da história para a conta", body: ["Você comprou 3 pizzas."], example: { label: "Traduzindo", lines: ["3 · x + 7 = 22", "3x + 7 = 22"] }, figure: { src: "/figuras/so/so-modos.svg", alt: "Duas faixas: modo usuário e modo núcleo.", caption: "O programa pede. O SO responde." }, code: { label: "Em C", text: "pid = fork();\nwaitpid(pid, ...);" } },
    { kind: "exam", title: "Como cai na prova", body: ["A prova pede o valor de x."], bullets: ["esqueceu de trocar o sinal"] },
    { kind: "recap", title: "Resumo em 1 minuto", body: ["Mexa nos dois lados do mesmo jeito."] },
  ],
};


window.scrollTo = vi.fn() as unknown as typeof window.scrollTo; // o jsdom não implementa scrollTo

afterEach(() => {
  cleanup();
  // A lição agora guarda onde a pessoa parou. Sem limpar, um teste que avança
  // faria o próximo começar no meio da lição.
  window.localStorage.clear();
});

describe("LessonStepper", () => {
  it("começa na primeira etapa, com a palavra nova em destaque e sem botão de voltar", () => {
    render(<LessonStepper lesson={lesson} />);

    expect(screen.getByRole("heading", { name: "Uma balança em equilíbrio" })).toBeTruthy();
    expect(screen.getByText("Etapa 1 de 4")).toBeTruthy();
    expect(screen.getByText("Palavra nova")).toBeTruthy();
    expect(screen.getByText(/uma conta com um valor escondido/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /voltar/i })).toBeNull();
    expect(screen.queryByText(/Praticar/)).toBeNull();
  });

  it("avança uma etapa por vez e mostra o exemplo resolvido", async () => {
    const user = userEvent.setup();
    render(<LessonStepper lesson={lesson} />);

    await user.click(screen.getByRole("button", { name: /continuar/i }));

    expect(screen.getByRole("heading", { name: "Da história para a conta" })).toBeTruthy();
    expect(screen.getByText("Etapa 2 de 4")).toBeTruthy();
    expect(screen.getByText("Traduzindo")).toBeTruthy();
    expect(screen.getByText("3x + 7 = 22")).toBeTruthy();
    // a etapa anterior sumiu da tela
    expect(screen.queryByRole("heading", { name: "Uma balança em equilíbrio" })).toBeNull();
  });

  it("volta para a etapa anterior", async () => {
    const user = userEvent.setup();
    render(<LessonStepper lesson={lesson} />);

    await user.click(screen.getByRole("button", { name: /continuar/i }));
    await user.click(screen.getByRole("button", { name: /voltar para a etapa anterior/i }));

    expect(screen.getByText("Etapa 1 de 4")).toBeTruthy();
  });

  it("na última etapa troca Continuar por Praticar, com o número de questões do plano", async () => {
    const user = userEvent.setup();
    render(<LessonStepper lesson={lesson} />);

    for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: /continuar/i }));

    expect(screen.getByRole("heading", { name: "Resumo em 1 minuto" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /continuar/i })).toBeNull();
    const practice = screen.getByRole("link", { name: /Praticar 5 questões/ });
    expect(practice.getAttribute("href")).toBe("/licao/7/praticar");
    expect(screen.getByText(/Plano grátis: 5 de 8 questões/)).toBeTruthy();
  });

  it("aceita as setas do teclado", async () => {
    const user = userEvent.setup();
    render(<LessonStepper lesson={lesson} />);

    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByText("Etapa 3 de 4")).toBeTruthy();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByText("Etapa 2 de 4")).toBeTruthy();
  });

  it("não passa da última nem antes da primeira etapa", async () => {
    const user = userEvent.setup();
    render(<LessonStepper lesson={lesson} />);

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByText("Etapa 1 de 4")).toBeTruthy();
    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}");
    expect(screen.getByText("Etapa 4 de 4")).toBeTruthy();
  });

  it("dá acesso direto às questões e sai da lição", () => {
    render(<LessonStepper lesson={lesson} />);

    expect(screen.getByRole("link", { name: "Ir às questões" }).getAttribute("href")).toBe("/licao/7/praticar");
    expect(screen.getByRole("link", { name: /Sair da lição/ }).getAttribute("href")).toBe("/materia/matematica-basica");
  });

  it("mostra os itens da lista na etapa de prova", async () => {
    const user = userEvent.setup();
    render(<LessonStepper lesson={lesson} />);

    await user.keyboard("{ArrowRight}{ArrowRight}");

    expect(screen.getByText("esqueceu de trocar o sinal")).toBeTruthy();
  });

  it("mostra a figura com texto alternativo e legenda", async () => {
    const user = userEvent.setup();
    render(<LessonStepper lesson={lesson} />);

    await user.click(screen.getByRole("button", { name: /continuar/i }));

    const image = screen.getByRole("img", { name: "Duas faixas: modo usuário e modo núcleo." });
    expect(image.getAttribute("src")).toBe("/figuras/so/so-modos.svg");
    expect(screen.getByText("O programa pede. O SO responde.")).toBeTruthy();
  });

  it("mostra o bloco de código com rótulo", async () => {
    const user = userEvent.setup();
    render(<LessonStepper lesson={lesson} />);

    await user.click(screen.getByRole("button", { name: /continuar/i }));

    expect(screen.getByText("Em C")).toBeTruthy();
    const code = document.querySelector("pre code");
    expect(code?.textContent).toBe("pid = fork();\nwaitpid(pid, ...);");
  });

  it("mostra a tabela com cabeçalhos e as células em fonte de código", async () => {
    const user = userEvent.setup();
    const withTable: LessonDetail = {
      ...lesson,
      steps: [{ kind: "explain", title: "Comandos", body: ["Compare."], table: { label: "Linux e Windows", headers: ["O que você quer", "Linux", "Windows"], rows: [["Listar arquivos", "ls", "dir"], ["Ver a pasta", "pwd", "cd"]], mono: true } }, lesson.steps[3]],
    };
    render(<LessonStepper lesson={withTable} />);

    expect(screen.getByText("Linux e Windows")).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Windows" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "Listar arquivos" }).className).not.toContain("font-mono");
    expect(screen.getByRole("cell", { name: "dir" }).className).toContain("font-mono");
    expect(screen.getAllByRole("row")).toHaveLength(3);
    await user.keyboard("{ArrowRight}");
    expect(screen.queryByRole("table")).toBeNull();
  });

  describe("retomar de onde parou", () => {
    it("guarda a etapa e devolve a pessoa a ela, avisando", async () => {
      const user = userEvent.setup();
      const first = render(<LessonStepper lesson={lesson} />);
      await user.click(screen.getByRole("button", { name: /continuar/i }));
      expect(screen.getByText("Etapa 2 de 4")).toBeTruthy();
      first.unmount();

      render(<LessonStepper lesson={lesson} />);

      expect(screen.getByText("Etapa 2 de 4")).toBeTruthy();
      expect(screen.getByText("Você tinha parado aqui.")).toBeTruthy();
    });

    it("o aviso some assim que a pessoa avança", async () => {
      const user = userEvent.setup();
      window.localStorage.setItem("castelei:licao:7:etapa", "1/4");
      render(<LessonStepper lesson={lesson} />);
      expect(screen.getByText("Você tinha parado aqui.")).toBeTruthy();

      await user.click(screen.getByRole("button", { name: /continuar/i }));

      expect(screen.queryByText("Você tinha parado aqui.")).toBeNull();
    });

    it("dá a saída para recomeçar, e a lição não volta a retomar", async () => {
      const user = userEvent.setup();
      window.localStorage.setItem("castelei:licao:7:etapa", "2/4");
      const first = render(<LessonStepper lesson={lesson} />);

      await user.click(screen.getByRole("button", { name: /começar do início/i }));
      expect(screen.getByText("Etapa 1 de 4")).toBeTruthy();
      first.unmount();

      render(<LessonStepper lesson={lesson} />);
      expect(screen.getByText("Etapa 1 de 4")).toBeTruthy();
      expect(screen.queryByText("Você tinha parado aqui.")).toBeNull();
    });

    it("ignora a marca quando a lição mudou de tamanho", () => {
      // Etapa 7 de uma lição de 11 não é etapa 7 de uma lição de 4.
      window.localStorage.setItem("castelei:licao:7:etapa", "7/11");
      render(<LessonStepper lesson={lesson} />);

      expect(screen.getByText("Etapa 1 de 4")).toBeTruthy();
    });

    it("esquece a marca quando a pessoa chega ao fim da lição", async () => {
      const user = userEvent.setup();
      window.localStorage.setItem("castelei:licao:7:etapa", "2/4");
      render(<LessonStepper lesson={lesson} />);

      await user.click(screen.getByRole("button", { name: /continuar/i }));

      expect(screen.getByText("Etapa 4 de 4")).toBeTruthy();
      expect(window.localStorage.getItem("castelei:licao:7:etapa")).toBeNull();
    });
  });
});
