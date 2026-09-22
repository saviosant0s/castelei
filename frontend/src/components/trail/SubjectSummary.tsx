import { CalendarDays } from "lucide-react";
import { Card, ProgressBar } from "@/components/ui";
import { contagemParaProva, progressoDaMateria } from "@/lib/subject-summary";
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
  lessons,
  examDate,
}: {
  lessons: LessonSummary[];
  examDate: string | null;
}) {
  const progresso = progressoDaMateria(lessons);
  const prova = contagemParaProva(examDate);

  // Matéria vazia não tem o que resumir, e barra de 0/0 é só ruído.
  if (progresso.total === 0) return null;

  return (
    <Card tone="sunken" className="space-y-3">
      {prova && (
        <p className="flex items-start gap-2.5 text-base">
          <CalendarDays
            className="mt-0.5 size-5 shrink-0 text-sky"
            aria-hidden="true"
          />
          <span>
            <strong>{prova.frase}</strong>
            <span className="text-content-secondary"> — {prova.data}.</span>
          </span>
        </p>
      )}

      <div className="flex items-center gap-3">
        <ProgressBar
          percent={progresso.percent}
          size="sm"
          tone={progresso.done === progresso.total ? "sage" : "sky"}
          label={`${progresso.done} de ${progresso.total} lições praticadas nesta matéria`}
          className="flex-1"
        />
        {/* O número vem escrito junto: barra sozinha obriga a medir a olho.
            E vem com o substantivo — "6/30" sozinho não diz de quê. */}
        <span className="shrink-0 text-sm text-content-secondary">
          <span className="font-mono font-bold tabular-nums">
            {progresso.done}/{progresso.total}
          </span>{" "}
          {/* "praticadas", não "concluídas com nota": a trilha não cobra
              acerto, e esta palavra precisa dizer o mesmo que os nós verdes. */}
          praticadas
        </span>
      </div>
    </Card>
  );
}
