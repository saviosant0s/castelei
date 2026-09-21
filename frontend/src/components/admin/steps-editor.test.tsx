// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StepsEditor } from "@/components/admin/StepsEditor";
import type { LessonStep } from "@/lib/types";

afterEach(cleanup);

const etapa = (extra: Partial<LessonStep> = {}): LessonStep => ({
  kind: "explain",
  title: "Título",
  body: ["Um parágrafo."],
  ...extra,
});

function montar(steps: LessonStep[]) {
  const onChange = vi.fn();
  render(<StepsEditor steps={steps} onChange={onChange} onErroDeJson={vi.fn()} />);

  return onChange;
}

describe("o medidor de paredão", () => {
  /*
   * A razão de o editor existir. O aviso do validador só chega DEPOIS de salvar,
   * e aviso junto com "salvo" raramente faz alguém voltar.
   */
  it("diz na cara quando nenhuma etapa tem apoio visual", () => {
    montar([etapa(), etapa(), etapa()]);

    expect(screen.getByText(/Nenhuma etapa tem figura/)).toBeTruthy();
    expect(screen.getByText(/paredão de texto/)).toBeTruthy();
  });

  it("avisa quando tem apoio de menos", () => {
    const steps = [etapa({ figure: { src: "/f.svg", alt: "a" } }), ...Array.from({ length: 7 }, () => etapa())];
    montar(steps);

    expect(screen.getByText(/Ainda lê como texto corrido/)).toBeTruthy();
  });

  it("para de reclamar quando há apoio suficiente", () => {
    const steps = [
      etapa({ figure: { src: "/f.svg", alt: "a" } }),
      etapa({ bullets: ["um"] }),
      etapa(),
    ];
    montar(steps);

    expect(screen.queryByText(/texto corrido/)).toBeNull();
    expect(screen.queryByText(/paredão/)).toBeNull();
  });
});

describe("blocos", () => {
  /* Escondidos atrás de um menu é o que faz quem escreve esquecer que existem. */
  it("os botões de bloco ficam à vista, mesmo os não usados", () => {
    montar([etapa()]);

    for (const nome of ["Figura", "Tabela", "Exemplo resolvido", "Código", "Lista", "Palavras novas", "Vídeo"]) {
      expect(screen.getByRole("button", { name: nome })).toBeTruthy();
    }
  });

  it("acrescentar um bloco devolve a etapa com ele", () => {
    const onChange = montar([etapa()]);

    fireEvent.click(screen.getByRole("button", { name: "Figura" }));

    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ figure: { src: "", alt: "", caption: "" } })]);
  });

  it("o bloco usado some da lista de acrescentar", () => {
    montar([etapa({ figure: { src: "", alt: "" } })]);

    expect(screen.queryByRole("button", { name: "Figura" })).toBeNull();
    expect(screen.getByRole("button", { name: /Tirar figura/ })).toBeTruthy();
  });

  /* O texto alternativo é o campo que mais se esquece e o único que impede entender a lição. */
  it("a figura pede texto alternativo, dizendo que é obrigatório", () => {
    montar([etapa({ figure: { src: "", alt: "" } })]);

    expect(screen.getByLabelText(/Texto alternativo \(obrigatório\)/)).toBeTruthy();
  });
});

describe("mexer nas etapas", () => {
  it("a primeira não sobe e a última não desce", () => {
    montar([etapa({ title: "A" }), etapa({ title: "B" })]);

    expect(screen.getByRole("button", { name: "Subir a etapa 1" })).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: "Descer a etapa 2" })).toHaveProperty("disabled", true);
  });

  it("desce a etapa", () => {
    const onChange = montar([etapa({ title: "A" }), etapa({ title: "B" })]);

    fireEvent.click(screen.getByRole("button", { name: "Descer a etapa 1" }));

    expect(onChange.mock.calls[0][0].map((s: LessonStep) => s.title)).toEqual(["B", "A"]);
  });

  it("insere logo depois da etapa apontada", () => {
    const onChange = montar([etapa({ title: "A" }), etapa({ title: "B" })]);

    fireEvent.click(screen.getByRole("button", { name: "Inserir etapa depois da 1" }));

    expect(onChange.mock.calls[0][0].map((s: LessonStep) => s.title)).toEqual(["A", "", "B"]);
  });

  /* Lição sem etapa nenhuma não existe: o botão precisa estar travado. */
  it("não deixa apagar a última etapa", () => {
    montar([etapa()]);

    expect(screen.getByRole("button", { name: "Apagar a etapa 1" })).toHaveProperty("disabled", true);
  });
});

describe("modo JSON", () => {
  it("continua disponível para colar conteúdo pronto", () => {
    montar([etapa()]);

    fireEvent.click(screen.getByRole("button", { name: /Editar como JSON/ }));

    expect(screen.getByLabelText(/Etapas \(JSON\)/)).toBeTruthy();
  });

  /*
   * Enquanto o JSON está pela metade vale a última versão boa. Sem isso,
   * apagar uma chave esvaziaria a lição a cada tecla.
   */
  it("JSON quebrado avisa mas não apaga as etapas", () => {
    const onChange = vi.fn();
    const onErro = vi.fn();
    render(<StepsEditor steps={[etapa()]} onChange={onChange} onErroDeJson={onErro} />);

    fireEvent.click(screen.getByRole("button", { name: /Editar como JSON/ }));
    fireEvent.change(screen.getByLabelText(/Etapas \(JSON\)/), { target: { value: "[{" } });

    expect(onErro).toHaveBeenCalledWith(expect.stringContaining("JSON inválido"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("JSON bom limpa o aviso e devolve as etapas", () => {
    const onChange = vi.fn();
    const onErro = vi.fn();
    render(<StepsEditor steps={[etapa()]} onChange={onChange} onErroDeJson={onErro} />);

    fireEvent.click(screen.getByRole("button", { name: /Editar como JSON/ }));
    fireEvent.change(screen.getByLabelText(/Etapas \(JSON\)/), {
      target: { value: '[{"kind":"recap","title":"R","body":["x"]}]' },
    });

    expect(onErro).toHaveBeenLastCalledWith(null);
    expect(onChange).toHaveBeenCalledWith([{ kind: "recap", title: "R", body: ["x"] }]);
  });

  /* Uma lista é o formato; um objeto solto quebraria a lição inteira. */
  it("recusa JSON que não é uma lista", () => {
    const onChange = vi.fn();
    const onErro = vi.fn();
    render(<StepsEditor steps={[etapa()]} onChange={onChange} onErroDeJson={onErro} />);

    fireEvent.click(screen.getByRole("button", { name: /Editar como JSON/ }));
    fireEvent.change(screen.getByLabelText(/Etapas \(JSON\)/), { target: { value: '{"kind":"idea"}' } });

    expect(onErro).toHaveBeenLastCalledWith("As etapas precisam ser uma lista.");
    expect(onChange).not.toHaveBeenCalled();
  });
});
