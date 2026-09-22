"use client";

/*
| A questão de associar.
|
| O terceiro formato, e ele existe porque duas colunas que se correspondem já
| estão espalhadas pelo conteúdo: open com "abrir um arquivo", `ls` com
| `Get-ChildItem`, cada termo com o seu significado. Perguntar isso em
| alternativa testa um par de cada vez; aqui a pessoa precisa saber os quatro
| ao mesmo tempo, porque usar um par errado tira a opção certa de outro.
|
| A mão é a MESMA da questão de ordenar, e isso é decisão: quem aprendeu a
| responder uma não precisa aprender a outra. Toca-se no item de baixo, ele
| sobe para a primeira vaga livre; toca-se na vaga, ele volta para o lugar de
| onde saiu. Sem arrastar — arrastar dentro de página que rola é o gesto que
| mais erra no celular.
*/
import { Check, X } from "lucide-react";

interface MatchQuestionProps {
  /** a coluna da esquerda, na ordem escrita */
  prompts: string[];
  /** a coluna da direita, embaralhada pelo servidor */
  options: string[];
  /** para cada item da esquerda, o índice escolhido em `options` (ou null) */
  matching: (number | null)[];
  onChange: (matching: (number | null)[]) => void;
  disabled: boolean;
  /** depois de responder: os pares certos */
  correctPairs: { left: string; right: string }[] | null;
}

export function MatchQuestion({
  prompts,
  options,
  matching,
  onChange,
  disabled,
  correctPairs,
}: MatchQuestionProps) {
  const usados = new Set(matching.filter((i): i is number => i !== null));
  const restantes = options.map((_, i) => i).filter((i) => !usados.has(i));

  function escolher(indice: number) {
    const vaga = matching.findIndex((valor) => valor === null);
    if (vaga === -1) return;
    onChange(matching.map((valor, i) => (i === vaga ? indice : valor)));
  }

  function limpar(posicao: number) {
    onChange(matching.map((valor, i) => (i === posicao ? null : valor)));
  }

  return (
    <div className="mt-6 space-y-5">
      <ul className="space-y-2">
        {prompts.map((prompt, posicao) => {
          const escolhido = matching[posicao];
          const certo = correctPairs ? correctPairs[posicao]?.right : null;
          const acertou = certo !== null && escolhido !== null && options[escolhido] === certo;

          return (
            <li
              key={prompt}
              className={`rounded-2xl border-2 px-4 py-3 ${
                correctPairs
                  ? acertou
                    ? "border-sage bg-sage-soft"
                    : "border-ink/10 bg-surface-raised"
                  : "border-ink/15 bg-surface-raised"
              }`}
            >
              <p className="text-base font-bold">{prompt}</p>

              {correctPairs ? (
                /*
                | O certo com um certo verde; o errado SEM x vermelho.
                |
                | A primeira versão punha um X ao lado da resposta CERTA, e
                | lia-se como "esta é a errada" — justo a linha que existe
                | para ensinar. Agora o par certo aparece sempre em texto
                | normal, e embaixo dele vem o que a pessoa tinha ligado.
                */
                <div className="mt-1">
                  <p className="flex items-center gap-2 text-base">
                    {acertou ? (
                      <Check className="size-5 shrink-0 text-sage" aria-hidden="true" />
                    ) : (
                      <span aria-hidden="true" className="size-5 shrink-0" />
                    )}
                    <span>{certo}</span>
                  </p>
                  {!acertou && (
                    <p className="mt-0.5 flex items-center gap-2 text-sm text-content-secondary">
                      <X className="size-4 shrink-0 text-brick" aria-hidden="true" />
                      <span>
                        {escolhido === null ? "Você não ligou esta." : `Você ligou com ${options[escolhido]}.`}
                      </span>
                    </p>
                  )}
                </div>
              ) : escolhido === null ? (
                <p className="mt-1 text-base text-content-subtle">Toque em uma resposta abaixo.</p>
              ) : (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => limpar(posicao)}
                  aria-label={`${prompt}: ${options[escolhido]}. Toque para trocar.`}
                  className="mt-1 min-h-11 w-full rounded-control border-2 border-sky bg-sky-soft px-3 py-2 text-left text-base transition disabled:opacity-60"
                >
                  {options[escolhido]}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {!correctPairs && restantes.length > 0 && (
        <section aria-labelledby="respostas">
          <h2 id="respostas" className="label-mono">
            Respostas
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {restantes.map((indice) => (
              <li key={indice}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => escolher(indice)}
                  className="min-h-11 rounded-control border-2 border-ink/15 bg-surface-raised px-4 py-2 text-base transition hover:border-ink/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60"
                >
                  {options[indice]}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
