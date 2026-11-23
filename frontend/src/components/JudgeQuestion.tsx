"use client";

/*
| A questão de certo ou errado, como no Cebraspe.
|
| A prova da PF (e de boa parte das polícias) não tem alternativas: cada
| frase é um item, e a pessoa julga se está certa ou errada. Um erro anula
| um acerto, e o item em branco vale zero. Saber deixar em branco é parte da
| prova, e por isso o botão de pular vira "Em branco" neste formato.
|
| Duas teclas grandes, lado a lado, sempre na mesma ordem: Certo à esquerda e
| Errado à direita, como os campos C e E da folha de respostas. O servidor não
| embaralha (ver Question::FORMAT_JUDGE), e o dedo aprende o lugar.
*/
import { Check, X } from "lucide-react";
import type { AnswerResult } from "@/lib/types";

interface JudgeQuestionProps {
  /** 0 = Certo, 1 = Errado; null = nada marcado ainda */
  selected: number | null;
  onSelect: (value: number) => void;
  disabled: boolean;
  /** depois de responder: qual era o gabarito e se a pessoa acertou */
  feedback: AnswerResult | null;
}

const OPCOES = [
  { valor: 0, nome: "Certo", Icone: Check },
  { valor: 1, nome: "Errado", Icone: X },
] as const;

export function JudgeQuestion({ selected, onSelect, disabled, feedback }: JudgeQuestionProps) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3" role="group" aria-label="Julgue o item">
      {OPCOES.map(({ valor, nome, Icone }) => {
        const marcada = selected === valor;
        const gabarito = feedback !== null && feedback.correct_index === valor;
        const errou = feedback !== null && marcada && !feedback.is_correct;

        let estilo = "border-ink/15 bg-surface-raised hover:border-ink/40";
        if (feedback === null && marcada) estilo = "border-sky bg-sky-soft";
        if (gabarito) estilo = "border-sage bg-sage-soft";
        if (errou) estilo = "border-brick bg-brick-soft";
        if (feedback !== null && !gabarito && !errou) estilo = "border-ink/10 bg-surface-raised opacity-60";

        return (
          <button
            key={valor}
            type="button"
            disabled={disabled}
            aria-pressed={marcada}
            onClick={() => onSelect(valor)}
            className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-4 py-3 text-lg font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${estilo}`}
          >
            <Icone className="size-6" aria-hidden="true" />
            {nome}
            {gabarito && <span className="text-xs font-medium">gabarito</span>}
          </button>
        );
      })}
    </div>
  );
}
