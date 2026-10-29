import type { StatsLesson, StatsSubject } from "./types";
import { nivel, type Nivel } from "./progress-groups";
import { pluralize } from "./format";

/*
| As contas da aba Resumo do Progresso. A tela só desenha.
|
| A pergunta que ela responde é "o que eu estudo agora?", e não "quanto eu já
| fiz". Por isso o domínio é o da ÚLTIMA resposta de cada questão (vem pronto
| da API), e a prontidão é dita em lições por semana: é o número que vira
| decisão. "Você domina 40%" não diz o que fazer amanhã.
*/

/** O estado de uma lição no mapa: o nível, ou "ainda não" se nunca praticada. */
export type MapState = Nivel | "nova";

export function mapState(lesson: StatsLesson): MapState {
  return lesson.mastery === null ? "nova" : nivel(lesson.mastery);
}

/** A frase de prontidão: quanto falta, e em que ritmo, se há prova marcada. */
export function readiness(subject: StatsSubject): string {
  const faltam = subject.lessons_total - subject.lessons_mastered;

  if (faltam <= 0) return "Você domina a matéria inteira. Agora é revisar para não esquecer.";

  const licoes = pluralize(faltam, "lição", "lições");
  const verbo = faltam === 1 ? "Falta" : "Faltam";
  const dias = subject.days_to_exam;

  if (dias === null) return `${verbo} ${licoes} para dominar a matéria. Não há data de prova marcada.`;

  if (dias <= 7) {
    const porDia = Math.ceil(faltam / dias);

    return `${verbo} ${licoes} e ${pluralize(dias, "dia", "dias")}: cerca de ${pluralize(porDia, "lição", "lições")} por dia.`;
  }

  const porSemana = Math.ceil(faltam / (dias / 7));

  return `${verbo} ${licoes} e ${pluralize(dias, "dia", "dias")}: cerca de ${pluralize(porSemana, "lição", "lições")} por semana.`;
}

export interface MapModule {
  name: string | null;
  /** número da lição na matéria, começando em 1 */
  lessons: (StatsLesson & { number: number })[];
}

/**
 * As lições em blocos de módulo, na ordem da matéria. Mesma regra da trilha:
 * lições SEGUIDAS com o mesmo nome formam um módulo.
 */
export function mapModules(lessons: StatsLesson[]): MapModule[] {
  const modulos: MapModule[] = [];

  lessons.forEach((lesson, i) => {
    const atual = modulos.at(-1);
    const item = { ...lesson, number: i + 1 };

    if (atual && atual.name === lesson.module) atual.lessons.push(item);
    else modulos.push({ name: lesson.module, lessons: [item] });
  });

  return modulos;
}

/** A frase grande ao lado do acerto: dá o veredito antes do número. */
export function comoEstou(acerto: number): string {
  if (acerto >= 85) return "Você está muito bem";
  if (acerto >= 70) return "Você está bem";
  if (acerto >= 50) return "Dá para melhorar";
  return "Hora de revisar";
}
