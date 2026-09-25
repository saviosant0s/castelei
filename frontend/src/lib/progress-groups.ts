import type { TopicStat } from "./types";

/*
| O Resumo do Progresso agrupa os tópicos pela lição.
|
| A API devolve um tópico por linha, e cada lição tem de seis a oito tópicos
| com uma ou duas questões cada. Um cartão por tópico dava, com oito lições
| praticadas, uma rolagem de dez mil pixels — e "0/1 certas" num tópico solto
| não diz nada: uma questão errada não é um ponto fraco, é uma questão errada.
| A lição inteira diz. Os tópicos continuam lá, recolhidos dentro dela, para
| quem quer saber ONDE a lição escorregou.
*/

export interface LessonGroup {
  lesson_id: number;
  lesson_title: string;
  subject_name: string;
  answered: number;
  correct: number;
  accuracy: number;
  /** Lição de escrita: são partes cumpridas, não questões certas. */
  writing: boolean;
  /** do mais fraco para o mais forte */
  topics: TopicStat[];
}

export type Nivel = "dominado" | "evoluindo" | "revisar";

/** A mesma régua que o tópico já usava: 80% domina, abaixo de 50% pede revisão. */
export function nivel(accuracy: number): Nivel {
  if (accuracy >= 80) return "dominado";
  if (accuracy < 50) return "revisar";

  return "evoluindo";
}

/** Lições da mais fraca para a mais forte; empate vai pela ordem alfabética. */
export function agruparPorLicao(topics: TopicStat[]): LessonGroup[] {
  const grupos = new Map<number, LessonGroup>();

  for (const topic of topics) {
    const grupo = grupos.get(topic.lesson_id) ?? {
      lesson_id: topic.lesson_id,
      lesson_title: topic.lesson_title,
      subject_name: topic.subject_name,
      answered: 0,
      correct: 0,
      accuracy: 0,
      writing: false,
      topics: [],
    };
    grupo.writing ||= topic.writing === true;
    grupo.answered += topic.answered;
    grupo.correct += topic.correct;
    grupo.topics.push(topic);
    grupos.set(topic.lesson_id, grupo);
  }

  return [...grupos.values()]
    .map((g) => ({
      ...g,
      accuracy: Math.round((g.correct / Math.max(g.answered, 1)) * 100),
      topics: [...g.topics].sort((a, b) => a.accuracy - b.accuracy || a.topic.localeCompare(b.topic, "pt-BR")),
    }))
    .sort((a, b) => a.accuracy - b.accuracy || a.lesson_title.localeCompare(b.lesson_title, "pt-BR"));
}
