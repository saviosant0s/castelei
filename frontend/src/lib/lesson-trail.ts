/*
| A trilha de uma matéria: como 30 lições viram um caminho em vez de uma lista.
|
| Só matemática e agrupamento aqui — nenhum componente, nenhum JSX. É o que
| permite testar a parte que erra (o estado de cada lição, a divisão em
| módulos, a geometria do ziguezague) sem montar tela.
|
| Duas decisões que valem ler antes de mexer:
|
| 1. O NÚMERO DO MÓDULO NÃO VEM DO BANCO. A lição guarda só o nome do assunto
|    ("Processos"); o "Módulo 3" sai da ordem, aqui. Se o número morasse no
|    conteúdo, reordenar a matéria deixaria um "Módulo 5" antes do 4.
|
| 2. MÓDULO É SEQUÊNCIA, NÃO ETIQUETA. Lições seguidas com o mesmo nome formam
|    um módulo; o mesmo nome reaparecendo lá na frente abre outro grupo, em vez
|    de puxar a lição de volta para cima. A trilha segue a ordem de estudo, e
|    nenhuma lição pode aparecer fora dela.
*/
import type { LessonSummary } from "./types";

/** Concluída, a próxima a fazer, ou ainda à frente. */
export type TrailState = "concluida" | "atual" | "adiante";

export interface TrailLesson {
  lesson: LessonSummary;
  state: TrailState;
  /** centro do nó, em % da largura da trilha */
  x: number;
}

/** As cores de módulo, em rodízio. Sem `brick`: vermelho no app quer dizer erro. */
export type TrailAccent = "sky" | "sage" | "coral";

const ACCENTS: TrailAccent[] = ["sky", "sage", "coral"];

export interface TrailModule {
  /** o assunto; null quando a matéria não usa módulos */
  name: string | null;
  /**
   * A cor deste trecho da trilha.
   *
   * Vem do rodízio, pela ordem — nunca do conteúdo. Com três cores e módulos
   * seguidos, dois vizinhos nunca saem iguais, e rolar a matéria passa a
   * parecer atravessar territórios em vez de uma fileira cinza sem fim.
   *
   * Aqui a cor diz MÓDULO, não estado. Quem carrega o estado é a forma: o
   * ícone de certo na concluída, o anel e o selo "Agora" na atual, e o
   * cinza-cavidade na que ainda falta. Cor nunca é o único sinal (regra 3 do
   * design system), e nesta tela ela nem é o principal.
   */
  accent: TrailAccent;
  /** 1, 2, 3... derivado da ordem. null junto com o nome */
  number: number | null;
  lessons: TrailLesson[];
  done: number;
  total: number;
  percent: number;
  /** contém a lição atual */
  current: boolean;
  /** vem depois do módulo atual: o caminho que ainda falta */
  ahead: boolean;
}

/*
| O ziguezague.
|
| Os deslocamentos são em PORCENTAGEM da largura, não em pixels: a mesma onda
| serve num celular de 320px e num tablet, e o traço atrás dos nós é um SVG
| que se estica junto. O ciclo de 8 passos desenha uma onda inteira — com 4
| passos o caminho vira zigue-zague de serrote, que cansa a vista na vertical.
|
| O título da lição mora AO LADO do nó, no lado para onde o caminho não vai.
| Antes ele morava embaixo, numa plaquinha de letra 12px: cada lição pedia
| 164px de altura (nó, estrelas, três linhas de título, folga), trinta e três
| lições davam nove telas de rolagem, e o texto — que é o que a pessoa lê —
| era a menor coisa da tela. Ao lado, a linha cabe em 108px e o título ganha
| a largura que sobra da onda.
|
| POR ISSO O NÓ NUNCA PARA NO EIXO. Com o nó no meio, o título tinha metade
| da tela menos o círculo — uns 130px, e "Chamadas de sistema: arquivos e
| processos" virava quatro linhas cortadas. A onda agora anda só pelas duas
| faixas laterais (30% a 36% e 64% a 70%), atravessando o meio entre um nó e
| outro: o título sempre fica com o lado largo.
*/
const WAVE = [-20, -14, 14, 20, 20, 14, -14, -20];

/** o eixo da trilha, em % */
export const CENTER = 50;

/** diâmetro do nó, em px */
export const NODE = 60;

/**
 * Distância vertical entre dois centros, em px.
 *
 * O rótulo fica ao lado do nó, centrado nele. Precisa caber o mais alto que
 * ele fica — três linhas de título e a linha de baixo (estrelas, "Agora" ou
 * onde a pessoa parou) —, com folga para não encostar no rótulo vizinho.
 */
export const ROW = 108;

/** Folga entre a borda do nó e o rótulo, em px. */
export const GAP = 10;

export function waveX(index: number): number {
  return CENTER + WAVE[index % WAVE.length];
}

/**
 * De que lado do nó fica o rótulo: o lado largo, que é o oposto ao do nó.
 * Nó à direita do eixo, rótulo à esquerda, e vice-versa.
 */
export function labelSide(index: number): "left" | "right" {
  return WAVE[index % WAVE.length] > 0 ? "left" : "right";
}

/**
 * Espaço embaixo do último nó, em px.
 *
 * Com o rótulo ao lado, ele não passa da altura do nó por muito: sobra só a
 * metade do rótulo que excede o círculo. Sem esta sobra, o cabeçalho do
 * módulo seguinte encostaria no marco.
 */
export const TAIL = 24;

/**
 * Quantas estrelas a lição concluída mostra.
 *
 * A primeira vem de graça: TERMINAR JÁ VALE. A trilha não cobra nota — quem
 * tirou 40% concluiu a lição e merece ver o caminho andar. As outras duas é
 * que dependem do acerto, e existem para dar vontade de voltar, não para
 * dizer que não acabou.
 *
 * Sem melhor resultado registrado (conteúdo antigo, tentativa sem nota) vale
 * uma estrela: concluiu.
 */
export function stars(bestPercent: number | null): 1 | 2 | 3 {
  if (bestPercent === null) return 1;
  if (bestPercent >= 90) return 3;
  if (bestPercent >= 70) return 2;

  return 1;
}

/**
 * Altura total da trilha de um módulo, em px.
 *
 * `count` inclui o marco do fim — para a trilha, ele é um nó como os outros.
 */
export function trailHeight(count: number): number {
  return NODE + Math.max(0, count - 1) * ROW + TAIL;
}

/**
 * O traço que liga os nós, em coordenadas do viewBox (x em 0–100, y em px).
 *
 * As alças verticais de meia linha dão a curva em S: sem elas o caminho vira
 * uma sequência de bicos.
 */
export function trailPath(xs: number[]): string {
  if (xs.length < 2) return "";

  const y = (i: number) => NODE / 2 + i * ROW;
  let d = `M ${xs[0]} ${y(0)}`;

  for (let i = 1; i < xs.length; i++) {
    d += ` C ${xs[i - 1]} ${y(i - 1) + ROW / 2}, ${xs[i]} ${y(i) - ROW / 2}, ${xs[i]} ${y(i)}`;
  }

  return d;
}

/**
 * Lição concluída é lição praticada até o fim pelo menos uma vez.
 *
 * Não é nota: quem tirou 40% terminou a lição e merece ver o caminho andar.
 * A qualidade da resposta já é contada em outro lugar (melhor resultado,
 * ponto fraco, evolução) — misturar as duas coisas transformaria a trilha
 * numa cobrança.
 */
export function concluida(lesson: LessonSummary): boolean {
  return lesson.attempts > 0;
}

export function buildTrail(lessons: LessonSummary[]): TrailModule[] {
  // A atual é a primeira ainda não praticada, na ordem da matéria. Quem pulou
  // a 2 e fez a 5 é levado de volta à 2 — é o buraco no caminho.
  const currentIndex = lessons.findIndex((lesson) => !concluida(lesson));

  const modules: TrailModule[] = [];
  let currentModule = -1;

  lessons.forEach((lesson, index) => {
    const name = lesson.module?.trim() || null;
    let bloco = modules[modules.length - 1];

    // Mesmo nome em lições seguidas = mesmo módulo. Nome novo (ou a ausência
    // dele) abre outro.
    if (!bloco || bloco.name !== name) {
      bloco = {
        name,
        number: null,
        accent: ACCENTS[modules.length % ACCENTS.length],
        lessons: [],
        done: 0,
        total: 0,
        percent: 0,
        current: false,
        ahead: false,
      };
      modules.push(bloco);
    }

    const state: TrailState = concluida(lesson) ? "concluida" : index === currentIndex ? "atual" : "adiante";

    if (state === "atual") currentModule = modules.length - 1;

    bloco.lessons.push({ lesson, state, x: waveX(bloco.lessons.length) });
  });

  let numero = 0;

  return modules.map((bloco, index) => {
    const concluidas = bloco.lessons.filter((item) => item.state === "concluida").length;
    // Só módulo com nome ganha número: a matéria sem módulos é uma trilha só.
    if (bloco.name !== null) numero++;

    return {
      ...bloco,
      number: bloco.name === null ? null : numero,
      done: concluidas,
      total: bloco.lessons.length,
      percent: bloco.lessons.length === 0 ? 0 : Math.round((concluidas / bloco.lessons.length) * 100),
      current: index === currentModule,
      ahead: currentModule !== -1 && index > currentModule,
    };
  });
}
