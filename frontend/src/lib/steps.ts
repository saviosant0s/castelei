import type { LessonStep, StepKind } from "@/lib/types";

/*
| As operações sobre etapas, sem JSX.
|
| Existem separadas porque são a parte que corrompe conteúdo em silêncio:
| remover o bloco errado, mover uma etapa para fora da lista, deixar um
| `table` com linhas de tamanhos diferentes. Um erro aqui não quebra a tela —
| publica uma lição torta.
|
| Tudo devolve cópia nova. Mutação no lugar é como o React perde alteração.
*/

/** Os blocos que uma etapa pode ter além dos parágrafos. */
export const BLOCOS = ["figure", "table", "example", "code", "bullets", "terms", "video"] as const;

export type Bloco = (typeof BLOCOS)[number];

export const NOME_DO_BLOCO: Record<Bloco, string> = {
  figure: "Figura",
  table: "Tabela",
  example: "Exemplo resolvido",
  code: "Código",
  bullets: "Lista",
  terms: "Palavras novas",
  video: "Vídeo",
};

/**
 * O que cada bloco ajuda a fazer.
 *
 * Fica ao lado do botão porque a pergunta de quem escreve não é "que blocos
 * existem", é "o que eu uso aqui". Nome de campo não responde isso.
 */
export const PARA_QUE_SERVE: Record<Bloco, string> = {
  figure: "Um desenho do app. Toda figura precisa de texto alternativo e legenda.",
  table: "Comparar lado a lado — Windows e Linux, antes e depois.",
  example: "Um caso resolvido, uma linha por passo. Marque “é uma sequência” e vira escada numerada.",
  code: "Um comando ou trecho de código, em fonte de máquina de escrever.",
  bullets: "Itens soltos que não formam parágrafo.",
  terms: "Palavras novas explicadas aqui mesmo, antes de serem usadas.",
  video: "Um vídeo enviado no painel ou um link do YouTube.",
};

export const KINDS: { valor: StepKind; nome: string; ajuda: string }[] = [
  { valor: "idea", nome: "Ideia", ajuda: "A analogia que abre a lição. Sempre a primeira etapa." },
  { valor: "explain", nome: "Explicação", ajuda: "O passo a passo. A lição tem várias destas." },
  { valor: "exam", nome: "Como cai na prova", ajuda: "O jargão de banca. Exatamente uma por lição." },
  { valor: "pitfall", nome: "Pegadinhas", ajuda: "Os erros comuns. Exatamente uma por lição." },
  { valor: "recap", nome: "Resumo", ajuda: "O fecho em um minuto. Sempre a última etapa." },
];

/** Um bloco recém-criado, já com a forma certa e vazio para preencher. */
export function blocoVazio(bloco: Bloco): NonNullable<LessonStep[Bloco]> {
  switch (bloco) {
    case "figure":
      return { src: "", alt: "", caption: "" };
    case "table":
      // Duas colunas e uma linha: a menor tabela que ainda é uma tabela.
      return { label: "", headers: ["", ""], rows: [["", ""]], mono: false };
    case "example":
      return { label: "Exemplo", lines: [""], ordered: false };
    case "code":
      return { label: "", text: "", notes: [""] };
    case "bullets":
      return [""];
    case "terms":
      return [{ word: "", meaning: "" }];
    case "video":
      return { src: "", title: "", caption: "" };
  }
}

export function temBloco(step: LessonStep, bloco: Bloco): boolean {
  return step[bloco] !== undefined;
}

export function adicionarBloco(step: LessonStep, bloco: Bloco): LessonStep {
  if (temBloco(step, bloco)) return step;

  return { ...step, [bloco]: blocoVazio(bloco) };
}

/**
 * Tira o bloco da etapa.
 *
 * Apaga a chave em vez de pôr `undefined`: `JSON.stringify` omite `undefined`,
 * mas o objeto em memória ainda teria a chave, e `temBloco` passaria a mentir.
 */
export function removerBloco(step: LessonStep, bloco: Bloco): LessonStep {
  const copia = { ...step };
  delete copia[bloco];

  return copia;
}

export function etapaVazia(kind: StepKind = "explain"): LessonStep {
  return { kind, title: "", body: [""] };
}

/**
 * Move a etapa uma posição para cima ou para baixo.
 *
 * Fora da lista, devolve o mesmo array: o botão da ponta não precisa saber que
 * é a ponta, e mover para lugar nenhum não pode apagar etapa.
 */
export function mover(steps: LessonStep[], de: number, direcao: -1 | 1): LessonStep[] {
  const para = de + direcao;
  if (de < 0 || de >= steps.length || para < 0 || para >= steps.length) return steps;

  const copia = [...steps];
  [copia[de], copia[para]] = [copia[para], copia[de]];

  return copia;
}

export function remover(steps: LessonStep[], indice: number): LessonStep[] {
  return steps.filter((_, i) => i !== indice);
}

export function trocar(steps: LessonStep[], indice: number, step: LessonStep): LessonStep[] {
  return steps.map((atual, i) => (i === indice ? step : atual));
}

/** Insere logo DEPOIS da etapa indicada: quem clica em "+" ali quer a nova ali. */
export function inserirApos(steps: LessonStep[], indice: number, step: LessonStep): LessonStep[] {
  const copia = [...steps];
  copia.splice(indice + 1, 0, step);

  return copia;
}

/** Texto de várias linhas ↔ lista de parágrafos. Linha em branco não vira parágrafo vazio. */
export function paraLinhas(texto: string): string[] {
  return texto.split("\n").map((linha) => linha.trim()).filter(Boolean);
}

export function deLinhas(linhas: string[] | undefined): string {
  return (linhas ?? []).join("\n");
}

/**
 * Acerta a tabela antes de salvar.
 *
 * Linha mais curta que o cabeçalho quebra a renderização, e linha mais longa
 * some sem avisar. Acontece sozinho ao acrescentar coluna, porque a coluna nova
 * entra no cabeçalho e não nas linhas que já existiam.
 */
export function normalizarTabela(tabela: NonNullable<LessonStep["table"]>): NonNullable<LessonStep["table"]> {
  const colunas = tabela.headers.length;

  return {
    ...tabela,
    rows: tabela.rows.map((linha) => {
      const ajustada = linha.slice(0, colunas);
      while (ajustada.length < colunas) ajustada.push("");

      return ajustada;
    }),
  };
}

/**
 * A etapa pronta para o servidor.
 *
 * Tira campo opcional vazio: `caption: ""` e `label: ""` viram ruído no arquivo
 * exportado e no JSON que alguém vai ler depois. O que é obrigatório fica, mesmo
 * vazio — quem reclama disso é o validador, com mensagem de gente.
 */
export function limpar(step: LessonStep): LessonStep {
  const saida: LessonStep = { kind: step.kind, title: step.title, body: step.body.filter(Boolean) };

  if (step.bullets?.some(Boolean)) saida.bullets = step.bullets.filter(Boolean);
  if (step.terms?.some((t) => t.word || t.meaning)) saida.terms = step.terms.filter((t) => t.word || t.meaning);
  if (step.example && step.example.lines.some(Boolean)) {
    saida.example = {
      label: step.example.label,
      lines: step.example.lines.filter(Boolean),
      ...(step.example.ordered ? { ordered: true } : {}),
    };
  }
  if (step.figure?.src) {
    saida.figure = {
      src: step.figure.src,
      alt: step.figure.alt,
      ...(step.figure.caption ? { caption: step.figure.caption } : {}),
    };
  }
  if (step.code?.text) {
    const notes = (step.code.notes ?? []).filter((n) => n.trim());
    saida.code = {
      ...(step.code.label ? { label: step.code.label } : {}),
      text: step.code.text,
      ...(notes.length ? { notes } : {}),
    };
  }
  if (step.video?.src) {
    saida.video = {
      src: step.video.src,
      ...(step.video.title ? { title: step.video.title } : {}),
      ...(step.video.caption ? { caption: step.video.caption } : {}),
    };
  }
  if (step.table && step.table.headers.some(Boolean)) {
    const tabela = normalizarTabela(step.table);
    saida.table = {
      ...(tabela.label ? { label: tabela.label } : {}),
      headers: tabela.headers,
      rows: tabela.rows,
      ...(tabela.mono ? { mono: true } : {}),
    };
  }

  return saida;
}

/**
 * Quantas etapas têm algo além de parágrafo.
 *
 * Alimenta o medidor do editor. É a mesma conta que o validador faz para avisar
 * "lição só de texto corrido" — mas mostrada ENQUANTO se escreve, que é quando
 * ainda dá para resolver.
 */
export function comApoioVisual(steps: LessonStep[]): number {
  return steps.filter((step) => BLOCOS.some((bloco) => {
    const valor = step[bloco];

    return Array.isArray(valor) ? valor.length > 0 : valor !== undefined;
  })).length;
}
