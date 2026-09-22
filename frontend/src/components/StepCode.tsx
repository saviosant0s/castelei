/*
| Um bloco de código com a tradução ao lado.
|
| A queixa que criou este componente, do Sávio estudando chamadas de sistema:
| "as linhas de código, você parte do pressuposto que eu já entendo de código".
| Ele estava certo. O bloco entrava na tela em fonte de máquina, fundo escuro,
| sem uma palavra sobre o que cada linha faz. Quem já programa lê; quem não
| programa vê um paredão preto e pula — e o app existe para quem parte do zero.
|
| Três decisões:
|
| - **A tradução tem uma linha por linha de código**, numerada, e o número
|   aparece também na canhoto do bloco. Sem o número, a lista embaixo vira mais
|   um parágrafo e a pessoa tem que contar linhas com o dedo.
| - **A explicação NÃO é comentário dentro do código.** Comentário sai em fonte
|   de máquina, foge na rolagem lateral junto com a linha e não passa pela
|   conferência do Guia Editorial. Fora do bloco, é texto como qualquer outro.
| - **Linha em branco não ganha número.** Ela é respiro, não instrução — e o
|   verificador conta igual, senão a numeração da tela discordaria da dele.
*/
import type { LessonStep } from "@/lib/types";

type CodeBlock = NonNullable<LessonStep["code"]>;

export function StepCode({ code }: { code: CodeBlock }) {
  const linhas = code.text.replace(/\s+$/, "").split("\n");
  const notas = code.notes ?? [];

  let contador = 0;
  const numeros = linhas.map((linha) => (linha.trim() ? ++contador : null));
  const comNumero = notas.length > 0 && contador === notas.length;

  return (
    <div className="mt-6">
      {code.label && <p className="label-mono mb-2">{code.label}</p>}

      {/*
        A numeração é uma COLUNA AO LADO, e não um número dentro de cada
        linha. Partir o código em um elemento por linha tiraria as quebras de
        linha do texto: quem copiasse o bloco levaria tudo grudado. Aqui o
        <code> continua sendo o texto original, inteiro.

        O alinhamento se sustenta porque a linha não quebra (`whitespace-pre`,
        com rolagem lateral): cada linha do código ocupa exatamente uma altura
        de linha, igual à do número ao lado.
      */}
      <div className="flex overflow-x-auto rounded-2xl bg-surface-bold p-4 font-mono text-sm leading-relaxed text-on-bold">
        {comNumero && (
          <div aria-hidden="true" className="mr-3 shrink-0 select-none text-right on-bold-subtle">
            {numeros.map((numero, i) => (
              <div key={i}>{numero ?? "\u00a0"}</div>
            ))}
          </div>
        )}
        <pre className="whitespace-pre">
          <code>{code.text}</code>
        </pre>
      </div>

      {notas.length > 0 && (
        <ol className="mt-3 space-y-2.5">
          {notas.map((nota, i) => (
            <li key={i} className="flex gap-3 text-base leading-relaxed">
              <span
                aria-hidden="true"
                className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-surface-sunken font-mono text-sm font-medium text-content-secondary"
              >
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="sr-only">Linha {i + 1}: </span>
                {nota}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
