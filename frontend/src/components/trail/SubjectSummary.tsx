import { ProgressBar } from "@/components/ui";
import { progressoDaMateria } from "@/lib/subject-summary";
import { ExamDateEditor } from "./ExamDateEditor";
import type { LessonSummary } from "@/lib/types";

/*
| A faixa de contexto da matéria, logo abaixo do título.
|
| A tela mostrava o caminho e o módulo, mas não respondia às duas perguntas
| que a pessoa faz ao abrir a matéria: "quanto disso eu já fiz?" e "quanto
| tempo eu tenho?".
|
| POR QUE NÃO XP AQUI. A tentação era um cabeçalho de XP e streak, no estilo
| dos apps de idioma. Duas razões para não: o XP é da CONTA, não da matéria —
| ele é o mesmo em Português e em Sistemas Operacionais, então não informa
| nada sobre a tela em que está —, e ele já mora em /progresso, que é a tela
| que existe para isso. O que só ESTA matéria sabe é a data da prova, e é o
| dado que nenhum app de flashcard tem. Ver docs/revisao-espacada.md.
|
| A contagem informa, não cobra: sem vermelho, sem ícone de alerta e sem
| mudar de tom na última semana. Vermelho no Castelei quer dizer erro, e o
| calendário andando não é erro de ninguém.
*/
export function SubjectSummary({
  subjectId,
  lessons,
  examDate,
}: {
  subjectId: number;
  lessons: LessonSummary[];
  /** A data que ESTA pessoa marcou. É ela quem diz quando é a prova. */
  examDate: string | null;
}) {
  const progresso = progressoDaMateria(lessons);

  // Matéria vazia não tem o que resumir, e barra de 0/0 é só ruído.
  if (progresso.total === 0) return null;

  /*
  | Uma linha só: a barra, o número e o botão da prova. Era um cartão com
  | três linhas de convite em cima da barra, e a matéria abria com dois
  | parágrafos antes da primeira lição. O formulário da data quebra para a
  | linha de baixo (flex-wrap) quando abre.
  */
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
      <ProgressBar
        percent={progresso.percent}
        size="sm"
        tone={progresso.done === progresso.total ? "sage" : "sky"}
        label={`${progresso.done} de ${progresso.total} lições praticadas nesta matéria`}
        className="min-w-24 flex-1"
      />
      {/* O número vem escrito junto: barra sozinha obriga a medir a olho. */}
      <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-content-secondary">
        {progresso.done}/{progresso.total}
      </span>
      <ExamDateEditor subjectId={subjectId} examDate={examDate} />
    </div>
  );
}
