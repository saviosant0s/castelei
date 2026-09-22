"use client";

/*
| A questão de ordenar.
|
| Por que ela existe: a múltipla escolha mede RECONHECER. Ela põe a resposta
| na tela e pergunta qual é — e boa parte da matéria não é sobre reconhecer, é
| sobre sequência. fork vem antes de execve. O pedido vem antes do TRAP.
| Liberar o SSH vem antes de ligar o firewall. Quem troca a ordem quebra a
| máquina, e a múltipla escolha nunca cobra isso.
|
| Três decisões de uso, todas para caber no polegar:
|
| - **Duas áreas, não arrastar.** Arrastar numa lista dentro de uma página que
|   rola é o gesto mais difícil de acertar no celular: o dedo ora arrasta o
|   item, ora rola a tela. Aqui se TOCA: o passo sobe para a sua ordem, e
|   tocar de novo o devolve.
| - **O passo devolvido volta ao LUGAR de onde saiu**, não para o fim da
|   fila. Fila que embaralha a cada arrependimento faz a pessoa perder de
|   vista o que já leu.
| - **Confirmar só acende com tudo posicionado.** Ordem pela metade não é
|   resposta errada, é resposta incompleta — e mandá-la gastaria uma questão.
*/
import { Check } from "lucide-react";

interface OrderQuestionProps {
  /** os passos como o servidor mandou, já embaralhados */
  options: string[];
  /** índices de `options`, na ordem escolhida */
  ordering: number[];
  onChange: (ordering: number[]) => void;
  /** trava tudo enquanto a resposta vai e volta, e depois dela */
  disabled: boolean;
  /** depois de responder: a sequência certa, para comparar */
  correctOrder: string[] | null;
}

export function OrderQuestion({ options, ordering, onChange, disabled, correctOrder }: OrderQuestionProps) {
  const restantes = options.map((_, i) => i).filter((i) => !ordering.includes(i));

  if (correctOrder) {
    return <Gabarito escolha={ordering.map((i) => options[i])} certa={correctOrder} />;
  }

  return (
    <div className="mt-6 space-y-5">
      <section aria-labelledby="sua-ordem">
        <h2 id="sua-ordem" className="label-mono">
          Sua ordem
        </h2>

        {ordering.length === 0 ? (
          <p className="mt-2 rounded-2xl border-2 border-dashed border-ink/20 px-4 py-6 text-center text-base text-content-subtle">
            Toque nos passos abaixo, do primeiro ao último.
          </p>
        ) : (
          <ol className="mt-2 space-y-2">
            {ordering.map((indice, posicao) => (
              <li key={indice}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(ordering.filter((i) => i !== indice))}
                  aria-label={`Passo ${posicao + 1}: ${options[indice]}. Toque para tirar da ordem.`}
                  className="flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 border-sky bg-sky-soft px-4 py-3 text-left text-base transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-8 shrink-0 place-items-center rounded-full bg-sky font-mono text-sm font-bold text-on-accent"
                  >
                    {posicao + 1}
                  </span>
                  <span>{options[indice]}</span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>

      {restantes.length > 0 && (
        <section aria-labelledby="passos">
          <h2 id="passos" className="label-mono">
            Passos
          </h2>
          <ul className="mt-2 space-y-2">
            {restantes.map((indice) => (
              <li key={indice}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange([...ordering, indice])}
                  className="flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 border-ink/15 bg-surface-raised px-4 py-3 text-left text-base transition hover:border-ink/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60"
                >
                  <span aria-hidden="true" className="size-8 shrink-0 rounded-full bg-ink/8" />
                  <span>{options[indice]}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/*
| Depois de responder.
|
| Mostrar só "errou" numa questão de ordem não ensina nada: o que falta saber
| é ONDE a sequência saiu do trilho. Por isso a ordem certa aparece por
| extenso, com um certo em cada passo que ficou no lugar.
*/
function Gabarito({ escolha, certa }: { escolha: string[]; certa: string[] }) {
  return (
    <div className="mt-6">
      <p className="label-mono">A ordem certa</p>
      <ol className="mt-2 space-y-2">
        {certa.map((passo, i) => {
          const acertou = escolha[i] === passo;

          return (
            <li
              key={passo}
              className={`flex min-h-14 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-base ${
                acertou ? "border-sage bg-sage-soft" : "border-ink/10 bg-surface-raised"
              }`}
            >
              <span
                aria-hidden="true"
                className={`grid size-8 shrink-0 place-items-center rounded-full font-mono text-sm font-bold ${
                  acertou ? "bg-sage text-on-accent" : "bg-ink/8"
                }`}
              >
                {acertou ? <Check className="size-4" /> : i + 1}
              </span>
              <span>{passo}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
