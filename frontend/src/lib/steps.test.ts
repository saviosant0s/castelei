import { describe, expect, it } from "vitest";
import {
  adicionarBloco,
  blocoVazio,
  comApoioVisual,
  deLinhas,
  etapaVazia,
  inserirApos,
  limpar,
  mover,
  normalizarTabela,
  paraLinhas,
  remover,
  removerBloco,
  temBloco,
  trocar,
} from "@/lib/steps";
import type { LessonStep } from "@/lib/types";

const etapa = (extra: Partial<LessonStep> = {}): LessonStep => ({
  kind: "explain",
  title: "Título",
  body: ["Um parágrafo."],
  ...extra,
});

describe("blocos", () => {
  it("cria o bloco já com a forma certa", () => {
    expect(blocoVazio("table")).toEqual({ label: "", headers: ["", ""], rows: [["", ""]], mono: false });
    expect(blocoVazio("bullets")).toEqual([""]);
  });

  it("acrescenta sem tocar na etapa original", () => {
    const antes = etapa();
    const depois = adicionarBloco(antes, "figure");

    expect(temBloco(depois, "figure")).toBe(true);
    expect(temBloco(antes, "figure")).toBe(false);
  });

  /* Acrescentar duas vezes não pode apagar o que a pessoa já escreveu. */
  it("não sobrescreve um bloco que já existe", () => {
    const com = etapa({ code: { label: "L", text: "ls -la" } });

    expect(adicionarBloco(com, "code").code?.text).toBe("ls -la");
  });

  /*
   * A chave é APAGADA, não posta como undefined: o JSON omitiria os dois, mas
   * `temBloco` passaria a mentir sobre o objeto em memória.
   */
  it("remover apaga a chave de verdade", () => {
    const sem = removerBloco(etapa({ code: { text: "x" } }), "code");

    expect("code" in sem).toBe(false);
  });
});

describe("mover etapas", () => {
  const tres = [etapa({ title: "A" }), etapa({ title: "B" }), etapa({ title: "C" })];

  it("troca com a de cima", () => {
    expect(mover(tres, 1, -1).map((s) => s.title)).toEqual(["B", "A", "C"]);
  });

  it("troca com a de baixo", () => {
    expect(mover(tres, 1, 1).map((s) => s.title)).toEqual(["A", "C", "B"]);
  });

  /* Mover para fora da lista não pode apagar etapa nem deixar buraco. */
  it("nas pontas não faz nada", () => {
    expect(mover(tres, 0, -1)).toBe(tres);
    expect(mover(tres, 2, 1)).toBe(tres);
    expect(mover(tres, 0, -1)).toHaveLength(3);
  });

  it("insere logo depois da etapa apontada", () => {
    const nova = etapa({ title: "NOVA" });

    expect(inserirApos(tres, 0, nova).map((s) => s.title)).toEqual(["A", "NOVA", "B", "C"]);
  });

  it("remove só a apontada", () => {
    expect(remover(tres, 1).map((s) => s.title)).toEqual(["A", "C"]);
  });

  it("troca só a apontada", () => {
    expect(trocar(tres, 1, etapa({ title: "X" })).map((s) => s.title)).toEqual(["A", "X", "C"]);
  });
});

describe("parágrafos", () => {
  it("ida e volta preserva o texto", () => {
    expect(deLinhas(paraLinhas("Um.\nDois."))).toBe("Um.\nDois.");
  });

  it("linha em branco não vira parágrafo vazio", () => {
    expect(paraLinhas("Um.\n\n   \nDois.")).toEqual(["Um.", "Dois."]);
  });
});

describe("normalizarTabela", () => {
  /*
   * Acontece sozinho ao acrescentar coluna: ela entra no cabeçalho e não nas
   * linhas que já existiam. Linha curta quebra a tela; linha longa some calada.
   */
  it("completa a linha curta", () => {
    const t = normalizarTabela({ headers: ["A", "B", "C"], rows: [["1"]] });

    expect(t.rows[0]).toEqual(["1", "", ""]);
  });

  it("corta a linha longa", () => {
    const t = normalizarTabela({ headers: ["A"], rows: [["1", "2", "3"]] });

    expect(t.rows[0]).toEqual(["1"]);
  });
});

describe("limpar", () => {
  it("tira legenda e rótulo vazios", () => {
    const pronto = limpar(etapa({ figure: { src: "/f.svg", alt: "Alt", caption: "" } }));

    expect(pronto.figure).toEqual({ src: "/f.svg", alt: "Alt" });
  });

  it("descarta bloco que ficou totalmente vazio", () => {
    const pronto = limpar(etapa({ code: { label: "", text: "" }, bullets: ["", ""] }));

    expect(pronto.code).toBeUndefined();
    expect(pronto.bullets).toBeUndefined();
  });

  it("mantém o bloco preenchido", () => {
    const pronto = limpar(etapa({ bullets: ["Um", "", "Dois"] }));

    expect(pronto.bullets).toEqual(["Um", "Dois"]);
  });

  /* `mono: false` é o padrão: escrever isso no arquivo é ruído. */
  it("só escreve mono quando é verdade", () => {
    expect(limpar(etapa({ table: { headers: ["A"], rows: [["1"]], mono: false } })).table?.mono).toBeUndefined();
    expect(limpar(etapa({ table: { headers: ["A"], rows: [["1"]], mono: true } })).table?.mono).toBe(true);
  });

  it("acerta a tabela na saída", () => {
    const pronto = limpar(etapa({ table: { headers: ["A", "B"], rows: [["1"]] } }));

    expect(pronto.table?.rows[0]).toEqual(["1", ""]);
  });

  it("parágrafo vazio não vai para o servidor", () => {
    expect(limpar(etapa({ body: ["Um.", "", "Dois."] })).body).toEqual(["Um.", "Dois."]);
  });
});

describe("comApoioVisual", () => {
  /* É a mesma conta que o validador faz, mostrada enquanto ainda dá para resolver. */
  it("conta só as etapas que têm algo além de parágrafo", () => {
    const steps = [
      etapa(),
      etapa({ figure: { src: "/f.svg", alt: "a" } }),
      etapa({ bullets: ["um"] }),
      etapa(),
    ];

    expect(comApoioVisual(steps)).toBe(2);
  });

  it("lista vazia não conta como apoio", () => {
    expect(comApoioVisual([etapa({ bullets: [] })])).toBe(0);
  });

  it("lição só de parágrafo dá zero", () => {
    expect(comApoioVisual([etapa(), etapa()])).toBe(0);
  });
});

describe("etapaVazia", () => {
  it("nasce pronta para digitar", () => {
    expect(etapaVazia()).toEqual({ kind: "explain", title: "", body: [""] });
    expect(etapaVazia("recap").kind).toBe("recap");
  });
});
