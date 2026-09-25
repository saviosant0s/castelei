/*
| A conferência da FORMA de um texto, feita na tela enquanto a pessoa escreve.
|
| É a primeira das três camadas da produção textual (ver `castelei.writing` no
| backend): grátis, instantânea e sem servidor. Ela não diz se o texto é bom —
| isso é a lista de autoavaliação e, com chave, a IA. Ela pega o que dá para
| contar: tamanho, frase comprida demais, palavra repetida, marca de fala e
| as exigências de cada parte ("a tese é uma frase só", "a conclusão usa um
| conectivo de conclusão").
|
| Nada aqui reprova. Tudo é aviso: quem está aprendendo a escrever precisa
| saber o que olhar, não levar um "errado" de um contador de vírgulas.
*/

/**
 * As exigências que uma parte do texto pode pedir, além das que valem sempre.
 * O validador do backend tem a mesma lista (`ContentValidator::WRITING_CHECKS`),
 * e um teste reprova se as duas divergirem.
 */
export const WRITING_CHECKS = [
  "uma_frase",
  "um_paragrafo",
  "titulo",
  "conectivo",
  "conclusivo",
  "concessivo",
  "sem_pergunta",
  "sem_eu_acho",
] as const;

export type WritingCheckId = (typeof WRITING_CHECKS)[number];

export interface WritingBrief {
  steps: string[];
  min_chars: number;
  max_chars: number;
  checks: string[];
  assemble: boolean;
  /** Parte de rascunho, como a tese sozinha: ela já está dentro de outra parte e não entra no texto juntado. */
  draft_only?: boolean;
  placeholder?: string | null;
}

export interface CheckResult {
  id: string;
  /** Uma frase curta, escrita como pedido: "Até 400 caracteres". */
  label: string;
  ok: boolean;
  /** O porquê, quando não está ok: o que foi encontrado. */
  detail?: string;
}

/** Acima disso a frase perde o leitor no meio do caminho. */
const PALAVRAS_POR_FRASE = 40;

/** Palavras que se repetem por natureza e não contam como repetição. */
const COMUNS = new Set(
  (
    "que para como mais mas porque pois isso esse essa este esta isto aquele aquela " +
    "pelo pela pelos pelas numa num uma umas uns com sem sobre entre também quando onde " +
    "muito muita muitos muitas pode podem deve devem ser são está estão foi fora tem têm " +
    "seu sua seus suas nosso nossa ele ela eles elas eram havia ainda apenas cada todo " +
    "toda todos todas outro outra outros outras mesmo mesma assim então já até após"
  ).split(" "),
);

/*
| Marcas de fala. Na conversa elas funcionam; no texto escrito formal,
| denunciam que o texto foi falado, não escrito. "A gente" entra porque, num
| texto de opinião, é a marca mais comum de quem ainda escreve como fala.
*/
/*
| `\b` do JavaScript não entende acento: para ele, "é" não é letra, e
| `\bné\b` nunca casa com "né". As fronteiras aqui são "não tem letra
| antes" e "não tem letra depois", no sentido Unicode.
*/
function palavra(expressao: string, depois = ""): RegExp {
  return new RegExp(`(?<!\\p{L})${expressao}(?!\\p{L})${depois}`, "giu");
}

const ORALIDADE: [RegExp, string][] = [
  [palavra("tipo", "(?=\\s*,|\\s+assim)"), "tipo"],
  [palavra("né"), "né"],
  [palavra("pra"), "pra"],
  [palavra("pro"), "pro"],
  [palavra("tá"), "tá"],
  [palavra("tô"), "tô"],
  [palavra("aí", "(?=\\s*,)"), "aí"],
  [palavra("daí"), "daí"],
  [palavra("a gente"), "a gente"],
  [palavra("beleza"), "beleza"],
];

const CONECTIVOS = [
  "além disso", "ademais", "também", "porque", "pois", "já que", "visto que", "uma vez que",
  "portanto", "assim", "dessa forma", "desse modo", "logo", "por isso", "consequentemente",
  "mas", "porém", "contudo", "no entanto", "entretanto", "todavia", "embora", "apesar de",
  "ainda que", "por exemplo", "ou seja", "isto é", "em primeiro lugar", "em segundo lugar",
  "por fim", "finalmente", "primeiramente", "sobretudo", "inclusive",
];

const CONCLUSIVOS = [
  "portanto", "assim", "dessa forma", "desse modo", "logo", "por isso", "em suma",
  "sendo assim", "diante disso", "diante do exposto", "conclui-se", "por conseguinte", "enfim",
];

/*
| Contra-argumentar é admitir o outro lado e responder a ele. Por isso vale
| tanto o conectivo de concessão ("embora", "é verdade que") quanto o de
| oposição que vem logo depois ("no entanto", "porém").
*/
const CONCESSIVOS = [
  "embora", "apesar de", "ainda que", "mesmo que", "por mais que", "é verdade que",
  "é certo que", "há quem", "não obstante", "no entanto", "porém", "contudo", "entretanto", "todavia",
];

const OPINIAO_FRACA = palavra("(?:eu acho|eu acredito|eu penso|na minha opinião|a meu ver)");

function limpo(texto: string): string {
  return texto.replace(/\r\n?/g, "\n").trim();
}

/** Frases: o texto partido depois de ponto, exclamação, interrogação ou reticências. */
export function sentences(texto: string): string[] {
  return limpo(texto)
    .split(/(?<=[.!?…])\s+|\n+/u)
    .map((f) => f.trim())
    .filter((f) => /\p{L}/u.test(f));
}

export function words(texto: string): string[] {
  return limpo(texto).toLocaleLowerCase("pt-BR").match(/\p{L}+(?:-\p{L}+)*/gu) ?? [];
}

/** Parágrafos: blocos separados por linha em branco (ou por quebra simples). */
export function paragraphs(texto: string): string[] {
  return limpo(texto)
    .split(/\n\s*\n|\n/u)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Procura expressões inteiras, sem casar "mas" dentro de "massa". */
function contem(texto: string, lista: string[]): string | null {
  const baixo = texto.toLocaleLowerCase("pt-BR");
  for (const expressao of lista) {
    const padrao = new RegExp(`(?<!\\p{L})${expressao}(?!\\p{L})`, "u");
    if (padrao.test(baixo)) return expressao;
  }
  return null;
}

function repetidas(texto: string): { palavra: string; vezes: number }[] {
  const contagem = new Map<string, number>();
  for (const w of words(texto)) {
    if (w.length < 4 || COMUNS.has(w)) continue;
    contagem.set(w, (contagem.get(w) ?? 0) + 1);
  }
  return [...contagem.entries()]
    .filter(([, n]) => n >= 3)
    .sort((a, b) => b[1] - a[1])
    .map(([palavra, vezes]) => ({ palavra, vezes }));
}

function inicio(frase: string): string {
  const w = frase.split(/\s+/).slice(0, 6).join(" ");
  return `“${w}…”`;
}

/**
 * Tudo que a tela confere, na ordem em que aparece. Texto vazio devolve a
 * lista com tudo pendente, para a pessoa ver ANTES de escrever o que vai ser
 * olhado.
 */
export function checkWriting(texto: string, brief: Pick<WritingBrief, "min_chars" | "max_chars" | "checks">): CheckResult[] {
  const t = limpo(texto);
  const vazio = t.length === 0;
  const resultado: CheckResult[] = [];
  const pede = (id: WritingCheckId) => brief.checks.includes(id);

  // Tamanho — sempre.
  const n = t.length;
  const tamanho =
    brief.min_chars > 0 ? `Entre ${brief.min_chars} e ${brief.max_chars} caracteres` : `Até ${brief.max_chars} caracteres`;
  resultado.push({
    id: "tamanho",
    label: tamanho,
    ok: !vazio && n >= brief.min_chars && n <= brief.max_chars,
    detail: vazio
      ? undefined
      : n < brief.min_chars
        ? `Faltam ${brief.min_chars - n} caracteres.`
        : n > brief.max_chars
          ? `Passou ${n - brief.max_chars} caracteres. Corte o que se repete.`
          : undefined,
  });

  const frases = sentences(t);

  if (pede("titulo")) {
    const primeira = t.split("\n")[0]?.trim() ?? "";
    const temTitulo = !vazio && t.includes("\n") && primeira.length > 0 && primeira.length <= 80 && !/[.!?:;]$/.test(primeira);
    resultado.push({
      id: "titulo",
      label: "Um título na primeira linha, sem ponto final",
      ok: temTitulo,
      detail: vazio || temTitulo ? undefined : "Escreva o título sozinho na primeira linha e pule uma linha antes do texto.",
    });
  }

  if (pede("uma_frase")) {
    resultado.push({
      id: "uma_frase",
      label: "Uma frase só",
      ok: frases.length === 1,
      detail: vazio || frases.length === 1 ? undefined : `São ${frases.length} frases. Junte o essencial numa só.`,
    });
  }

  if (pede("um_paragrafo")) {
    const ps = paragraphs(t).length;
    resultado.push({
      id: "um_paragrafo",
      label: "Um parágrafo só",
      ok: !vazio && ps === 1,
      detail: vazio || ps === 1 ? undefined : `São ${ps} parágrafos. Esta parte é um bloco só.`,
    });
  }

  if (pede("conectivo")) {
    const achou = contem(t, CONECTIVOS);
    resultado.push({
      id: "conectivo",
      label: "Pelo menos um conectivo (além disso, porque, portanto…)",
      ok: achou !== null,
      detail: vazio || achou ? undefined : "Ligue as ideias com uma palavra que diga a relação entre elas.",
    });
  }

  if (pede("concessivo")) {
    const achou = contem(t, CONCESSIVOS);
    resultado.push({
      id: "concessivo",
      label: "Admite o outro lado (embora, é verdade que, no entanto…)",
      ok: achou !== null,
      detail: vazio || achou ? undefined : "Mostre o argumento contrário antes de responder a ele.",
    });
  }

  if (pede("conclusivo")) {
    const achou = contem(t, CONCLUSIVOS);
    resultado.push({
      id: "conclusivo",
      label: "Um conectivo de conclusão (portanto, dessa forma…)",
      ok: achou !== null,
      detail: vazio || achou ? undefined : "Avise o leitor de que o texto está fechando.",
    });
  }

  if (pede("sem_pergunta")) {
    const perguntas = (t.match(/\?/g) ?? []).length;
    resultado.push({
      id: "sem_pergunta",
      label: "Afirma, não pergunta",
      ok: !vazio && perguntas === 0,
      detail: perguntas ? "Tese em forma de pergunta deixa o leitor sem saber o que você defende." : undefined,
    });
  }

  if (pede("sem_eu_acho")) {
    const achados = [...new Set((t.match(OPINIAO_FRACA) ?? []).map((m) => m.toLocaleLowerCase("pt-BR")))];
    resultado.push({
      id: "sem_eu_acho",
      label: "Defende sem “eu acho”",
      ok: !vazio && achados.length === 0,
      detail: achados.length ? `Encontrei “${achados.join("”, “")}”. Afirme a ideia: ela já é sua.` : undefined,
    });
  }

  // As que valem sempre, depois das que a parte pediu.
  const longas = frases.filter((f) => f.split(/\s+/).length > PALAVRAS_POR_FRASE);
  resultado.push({
    id: "frases_longas",
    label: `Frases de até ${PALAVRAS_POR_FRASE} palavras`,
    ok: !vazio && longas.length === 0,
    detail: longas.length ? `A frase que começa em ${inicio(longas[0])} está longa demais. Divida em duas.` : undefined,
  });

  const rep = repetidas(t);
  resultado.push({
    id: "repeticao",
    label: "Sem palavra repetida muitas vezes",
    ok: !vazio && rep.length === 0,
    detail: rep.length
      ? `“${rep[0].palavra}” aparece ${rep[0].vezes} vezes. Troque por um sinônimo ou por um pronome.`
      : undefined,
  });

  const falas = ORALIDADE.filter(([padrao]) => {
    padrao.lastIndex = 0;
    return padrao.test(t);
  }).map(([, nome]) => nome);
  resultado.push({
    id: "oralidade",
    label: "Sem marca de fala (tipo, né, pra…)",
    ok: !vazio && falas.length === 0,
    detail: falas.length ? `Encontrei “${falas.join("”, “")}”. No texto escrito, prefira a forma formal.` : undefined,
  });

  return resultado;
}

/**
 * O texto que junta as partes: cada parte num parágrafo, na ordem em que
 * foram escritas. É o ponto de partida da etapa final, não o texto pronto —
 * juntar bem é justamente ligar um parágrafo ao outro.
 */
export function assemble(partes: string[]): string {
  return partes
    .map((p) => limpo(p))
    .filter(Boolean)
    .join("\n\n");
}

/**
 * O pedido que o botão "copiar para corrigir com IA" põe na área de
 * transferência. Leva a proposta, o roteiro e os critérios junto do texto —
 * sem eles, a IA corrige outro texto, o que ela imagina que devia ser.
 */
export function aiPrompt(input: { statement: string; steps: string[]; checklist: string[]; text: string }): string {
  const linhas = [
    "Sou estudante universitário e estou aprendendo produção textual. Corrija o texto abaixo como um professor.",
    "Comente o sentido e a organização: diga o que já está bom, depois de dois a quatro pontos para melhorar (com o trecho e como reescrever). Não dê nota e não reescreva o texto inteiro.",
    "",
    `Proposta: ${input.statement}`,
  ];
  if (input.steps.length) linhas.push("", "O que o texto precisa ter:", ...input.steps.map((s) => `- ${s}`));
  if (input.checklist.length) linhas.push("", "Critérios:", ...input.checklist.map((c) => `- ${c}`));
  linhas.push("", "Meu texto:", '"""', limpo(input.text), '"""');
  return linhas.join("\n");
}
