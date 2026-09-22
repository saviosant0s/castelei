/*
| O resumo da matéria: quanto falta para a prova e quanto do caminho já andou.
|
| Fica longe do JSX pela mesma razão de `lib/review.ts`: são contas de
| CALENDÁRIO e frases com concordância, a dupla que mais erra em silêncio.
| "Faltam 1 dias", "faltam -3 dias" e a prova que anda um dia para trás porque
| a conta rodou às 22h são bugs que teste de componente não pega.
|
| A regra de tom é a mesma da revisão: a contagem INFORMA, não cobra. Quem
| abre a matéria a uma semana da prova já sabe que está apertado.
*/
import { concluida } from "./lesson-trail";
import type { LessonSummary } from "./types";

/** O fuso do aluno. O servidor que renderiza esta página roda em UTC. */
const FUSO = "America/Sao_Paulo";

/**
 * O dia de hoje no fuso do aluno, como "AAAA-MM-DD".
 *
 * `en-CA` é o atalho honesto para o formato ISO: `Intl` já resolve o fuso, e
 * assim não existe um `new Date()` intermediário para deslocar a data.
 */
export function hojeNoFuso(
  agora: Date = new Date(),
  fuso: string = FUSO,
): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: fuso }).format(agora);
}

/** Meia-noite UTC de uma data "AAAA-MM-DD", sem passar por fuso nenhum. */
function meiaNoite(iso: string): number {
  return Date.UTC(
    Number(iso.slice(0, 4)),
    Number(iso.slice(5, 7)) - 1,
    Number(iso.slice(8, 10)),
  );
}

/**
 * Dias de calendário entre duas datas "AAAA-MM-DD".
 *
 * Calendário, não horas — é assim que a pessoa conta. Como os dois lados são
 * meia-noite UTC, horário de verão não entra na conta.
 */
export function diasEntre(de: string, ate: string): number {
  return Math.round((meiaNoite(ate) - meiaNoite(de)) / 86_400_000);
}

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** "2026-12-15" → "15 de dezembro". */
export function dataPorExtenso(iso: string): string {
  return `${Number(iso.slice(8, 10))} de ${MESES[Number(iso.slice(5, 7)) - 1]}`;
}

export interface ContagemProva {
  dias: number;
  /** "Faltam 84 dias para a prova" */
  frase: string;
  /** "15 de dezembro" */
  data: string;
}

/**
 * Quanto falta para a prova da matéria.
 *
 * null quando não há data marcada OU quando ela já passou: matéria sem prazo
 * volta ao plano de longo prazo, e contagem negativa não é notícia — é
 * cobrança por algo que não dá mais para mudar.
 *
 * O dia da prova ainda conta ("A prova é hoje"): é o único dia em que a
 * matéria tem urgência de verdade. O backend devolve null aqui porque para
 * ELE `daysToExam = 0` não serve de prazo para agendar nada (ver
 * `ReviewService::daysToExam`); para a tela, serve de aviso.
 */
export function contagemParaProva(
  examDate: string | null | undefined,
  hoje: string = hojeNoFuso(),
): ContagemProva | null {
  if (!examDate) return null;

  const dias = diasEntre(hoje, examDate);
  if (dias < 0) return null;

  // "Falta 1 dias" é o erro clássico: o verbo concorda junto com o número.
  const frase =
    dias === 0
      ? "A prova é hoje"
      : dias === 1
        ? "Falta 1 dia para a prova"
        : `Faltam ${dias} dias para a prova`;

  return { dias, frase, data: dataPorExtenso(examDate) };
}

export interface ProgressoDaMateria {
  done: number;
  total: number;
  percent: number;
}

/**
 * Quanto da matéria já foi praticado.
 *
 * Usa o MESMO `concluida` da trilha de propósito: se um dia "concluída"
 * passar a exigir nota, os nós verdes e este número precisam virar juntos.
 * Duas definições de concluída é a receita para a barra dizer 6 e o caminho
 * mostrar 7.
 */
export function progressoDaMateria(
  lessons: LessonSummary[],
): ProgressoDaMateria {
  const total = lessons.length;
  const done = lessons.filter(concluida).length;

  return {
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}
