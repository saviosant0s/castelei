/*
| O vocabulário da matéria, do lado da tela.
|
| Só agrupamento e frase — nenhum componente. As duas coisas que erram aqui são
| a letra inicial (que precisa ignorar acento, senão "Índice" abre um grupo "Í"
| sozinho, longe do "I") e a concordância da contagem.
*/
import type { VocabularyTerm } from "./types";

export interface GrupoDeTermos {
  /** a letra do grupo, já sem acento e em maiúscula */
  letra: string;
  termos: VocabularyTerm[];
}

/**
 * A letra de dicionário de uma palavra: maiúscula e sem acento.
 *
 * `normalize("NFD")` separa a letra do acento e o `replace` joga o acento fora
 * — é o que faz "Índice" cair no grupo "I". Palavra que começa com número ou
 * símbolo vai para "#", como em índice remissivo de livro.
 */
export function letraDe(palavra: string): string {
  const primeira = palavra
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .charAt(0)
    .toUpperCase();

  return /[A-Z]/.test(primeira) ? primeira : "#";
}

/**
 * Agrupa os termos por letra inicial, mantendo a ordem que veio do servidor.
 *
 * A ordenação alfabética é feita no backend, onde mora a regra de unicidade —
 * reordenar aqui seria uma segunda régua, que discordaria da primeira no dia
 * em que uma das duas mudasse.
 */
export function agrupar(termos: VocabularyTerm[]): GrupoDeTermos[] {
  const grupos: GrupoDeTermos[] = [];

  for (const termo of termos) {
    const letra = letraDe(termo.word);
    const ultimo = grupos[grupos.length - 1];

    if (ultimo && ultimo.letra === letra) {
      ultimo.termos.push(termo);
    } else {
      grupos.push({ letra, termos: [termo] });
    }
  }

  return grupos;
}

/** "12 palavras", "1 palavra", "Nenhuma palavra ainda". */
export function contagem(quantas: number): string {
  if (quantas === 0) return "Nenhuma palavra ainda";
  if (quantas === 1) return "1 palavra";

  return `${quantas} palavras`;
}

/**
 * Quantas palavras já apareceram nas lições praticadas.
 *
 * O número só é dito quando há o que dizer: "0 de 74" na primeira visita é
 * uma cobrança, e a página existe para socorrer quem travou numa palavra.
 */
export function jaVistas(termos: VocabularyTerm[]): number {
  return termos.filter((t) => t.seen).length;
}

/**
 * A explicação de para que a página serve.
 *
 * Escrita para quem chegou aqui travado numa palavra, não para quem quer
 * decorar lista: por isso diz onde cada palavra é explicada por inteiro.
 */
export const PARA_QUE_SERVE =
  "Toda palavra nova da matéria, com o significado em uma frase. Tocando numa delas você vai para a lição em que ela é explicada por inteiro.";

/*
| Por que a palavra de lição não praticada fica apagada, e não escondida.
|
| A matéria inteira precisa estar aqui: quem chega travado numa palavra veio
| procurá-la, e esconder o que ainda não foi estudado transformaria a página
| numa tranca. Mas a lista completa, na primeira semana, é uma parede de
| palavras que a pessoa nunca viu — e não dá para saber o que já é seu.
|
| Apagado resolve os dois: continua legível e continua clicável, só que o olho
| passa por cima. É a mesma decisão do nó cinza da trilha: orienta, não tranca.
*/
export const AINDA_NAO_VISTAS = "As mais apagadas são de lições que você ainda não praticou.";
