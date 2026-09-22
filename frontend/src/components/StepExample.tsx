/*
| O bloco de exemplo, em duas formas.
|
| Ele vinha fazendo dois trabalhos diferentes com a mesma cara: uma lista de
| coisas ("os quatro pedidos", "como o prompt aparece") e uma SEQUÊNCIA de
| passos ("salvar um arquivo", "o que o processador faz de verdade"). As duas
| saíam como linhas soltas em fonte de máquina, e a sequência perdia o que
| tinha de mais importante — a ordem. Quem lia via quatro frases; o que
| estava sendo dito era "primeiro isto, depois aquilo".
|
| Com `ordered`, o bloco vira uma escada: número em círculo, traço ligando um
| passo ao seguinte, e texto em fonte normal. Fonte de máquina serve para
| comando e para código; passo é português e merece ser lido como tal.
|
| É um CAMPO, não uma adivinhação. Tentar descobrir a forma pelo conteúdo
| ("começa com 1.?") erraria nos dois sentidos, e quem escreve sabe a
| resposta sem pensar: trocar duas linhas de lugar estragaria o exemplo?
*/
import type { LessonStep } from "@/lib/types";

type ExampleBlock = NonNullable<LessonStep["example"]>;

export function StepExample({ example }: { example: ExampleBlock }) {
  if (!example.ordered) {
    return (
      <div className="mt-6 rounded-2xl bg-surface-raised p-5 shadow-lift">
        <p className="label-mono">{example.label}</p>
        <ol className="mt-3 space-y-2 font-mono text-base">
          {example.lines.map((line, i) => (
            <li key={i} className={i === example.lines.length - 1 ? "font-medium" : "text-ink/80"}>
              {line}
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl bg-surface-raised p-5 shadow-lift">
      <p className="label-mono">{example.label}</p>

      <ol className="mt-3">
        {example.lines.map((line, i) => {
          const ultimo = i === example.lines.length - 1;

          return (
            <li key={i} className="flex gap-3">
              {/*
                A coluna do número, com o traço descendo até o próximo. O
                traço é do ITEM, não um elemento à parte: assim ele acompanha
                a altura do texto ao lado, que muda com a quebra de linha.
              */}
              <div className="flex flex-col items-center">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sky font-mono text-sm font-bold text-on-accent">
                  {i + 1}
                </span>
                {!ultimo && <span className="w-0.5 flex-1 bg-sky/30" aria-hidden="true" />}
              </div>

              <p className={`text-base leading-relaxed ${ultimo ? "pb-0" : "pb-4"}`}>{line}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
