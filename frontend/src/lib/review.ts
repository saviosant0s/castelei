import type { ReviewItem } from "@/lib/types";

/*
| As frases da revisão.
|
| Ficam aqui, longe do JSX, porque são a parte que mais erra: "Atrasada 1 dias",
| "Vence em -2 dias" e "há 0 dias" são bugs que nenhum teste de componente pega
| se a frase estiver enterrada no meio da marcação.
|
| Regra de tom: a revisão CONVIDA, não cobra. Quem abre o app com sete lições
| atrasadas já se sente mal o bastante — o texto não precisa ajudar.
*/

/** "Vence hoje", "Atrasada 3 dias", "Vence amanhã". */
export function quandoVence(diasAtrasada: number): string {
  if (diasAtrasada > 1) return `Atrasada ${diasAtrasada} dias`;
  if (diasAtrasada === 1) return "Atrasada 1 dia";
  if (diasAtrasada === 0) return "Vence hoje";
  if (diasAtrasada === -1) return "Vence amanhã";
  return `Vence em ${Math.abs(diasAtrasada)} dias`;
}

/** "Você fez 60% da última vez." Sem nota, não inventa. */
export function ultimoResultado(percent: number | null): string | null {
  return percent === null ? null : `Você fez ${percent}% da última vez.`;
}

/**
 * Por que esta lição voltou agora.
 *
 * É a frase que transforma o agendamento em algo que dá para confiar. Sem ela,
 * "revise isto hoje" é só o app mandando.
 */
export function porQueAgora(item: ReviewItem): string {
  const { days_to_exam: prova, interval_days: intervalo } = item;

  if (prova === null) {
    return `Marcada para voltar ${emDias(intervalo)} depois da última vez.`;
  }

  // "Faltam 1 dia" é o erro clássico: o verbo concorda junto com o número.
  const falta = prova === 1 ? "Falta 1 dia" : `Faltam ${prova} dias`;

  return `${falta} para a prova, então esta lição volta a cada ${emDias(intervalo)}.`;
}

function emDias(dias: number): string {
  return dias === 1 ? "1 dia" : `${dias} dias`;
}

/**
 * A explicação do método, escrita uma vez para a tela inteira.
 *
 * O achado de Cepeda et al. (2008) em uma frase, sem citar o estudo na cara do
 * aluno: ele quer estudar, não ler bibliografia. A fonte está na documentação.
 */
export const COMO_FUNCIONA =
  "O intervalo entre as revisões é uma fatia do tempo que falta para a prova: quanto mais perto ela fica, mais juntas elas ficam.";

/**
 * O contexto que ancora a fila inteira: a prova mais próxima entre as lições
 * dela.
 *
 * É a versão honesta de "por que hoje" para uma LISTA. Dizer "esta lição volta
 * a cada 5 dias" embaixo de quatro lições diferentes não tem referente — e as
 * quatro têm intervalos diferentes, então a frase seria falsa para três delas.
 *
 * Devolve null quando nenhuma das lições tem prova marcada: aí não há prazo
 * para citar e o texto do cabeçalho já basta.
 */
export function resumoDaProva(itens: ReviewItem[]): string | null {
  const comProva = itens.filter((item) => item.days_to_exam !== null);
  if (comProva.length === 0) return null;

  const proxima = comProva.reduce((a, b) => (a.days_to_exam! <= b.days_to_exam! ? a : b));
  const dias = proxima.days_to_exam!;
  const quanto = dias === 1 ? "Falta 1 dia" : `Faltam ${dias} dias`;
  const materia = proxima.subject_name ? ` de ${proxima.subject_name}` : "";

  return `${quanto} para a prova${materia}. É por isso que as revisões estão neste ritmo — e elas vão se aproximando conforme a data chega.`;
}

/** Título honesto do bloco, pelo tamanho da fila. */
export function tituloDaFila(quantas: number): string {
  if (quantas === 0) return "Nada para revisar";
  if (quantas === 1) return "1 lição para revisar";
  return `${quantas} lições para revisar`;
}
