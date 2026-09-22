"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LessonStep } from "@/lib/types";

/*
| A tabela de uma etapa de lição.
|
| Ela ROLA PARA O LADO, e o app esconde toda barra de rolagem (`globals.css`).
| Sem aviso, uma tabela de três colunas num celular de 390px aparece com a
| última coluna cortada no meio de uma palavra — e quem lê conclui que o
| conteúdo está quebrado, não que falta arrastar. Foi assim que o defeito
| apareceu: a tabela dos números de resposta terminava em "de quem costuma s".
|
| Por isso existe o aviso, e por isso ele é MEDIDO, não fixo. Sombra ou frase
| permanente numa tabela que cabe inteira seria mentira, e a pessoa aprenderia
| a ignorar as duas.
|
| A medida roda na montagem, ao girar o aparelho e ao rolar. A regra 3 do Guia
| manda mostrar o comando no Windows e no Linux lado a lado, então tabela larga
| é o caso comum nesta plataforma, não a exceção.
*/
export function StepTable({
  table,
}: {
  table: NonNullable<LessonStep["table"]>;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const [temMais, setTemMais] = useState(false);

  const medir = useCallback(() => {
    const el = caixa.current;
    if (!el) return;

    // 2px de folga: arredondamento de subpixel faria a sombra piscar no fim.
    setTemMais(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    medir();

    const el = caixa.current;
    if (!el) return;

    /*
    | O observador é o que pega a mudança de largura da própria tabela — fonte
    | que termina de carregar, por exemplo. Ele é opcional de propósito: onde
    | não existir, a medida do `resize` da janela e a do scroll continuam
    | valendo, e o componente degrada em vez de quebrar.
    */
    const observador = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(medir);
    observador?.observe(el);
    window.addEventListener("resize", medir);

    return () => {
      observador?.disconnect();
      window.removeEventListener("resize", medir);
    };
  }, [medir]);

  return (
    <div className="mt-6 overflow-hidden rounded-2xl bg-surface-raised shadow-lift">
      {table.label && <p className="label-mono px-4 pt-4">{table.label}</p>}

      <div className="relative">
        <div ref={caixa} onScroll={medir} className="overflow-x-auto">
          <table className="mt-2 w-full min-w-[26rem] text-left text-sm">
            <thead>
              <tr className="border-b-2 border-ink/15">
                {table.headers.map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="px-4 py-2.5 font-bold"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, r) => (
                <tr key={r} className="border-t border-ink/10">
                  {row.map((cell, c) => (
                    <td
                      key={c}
                      className={`break-words px-4 py-2.5 align-top ${table.mono && c > 0 ? "font-mono" : ""}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* A sombra diz que a tabela continua; a frase diz o que fazer. Só a
            sombra vira enfeite, e só a frase passa despercebida. */}
        {temMais && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-surface-raised to-transparent"
          />
        )}
      </div>

      {temMais && (
        <p className="px-4 pb-3 text-xs text-content-subtle">
          Arraste a tabela para o lado para ver o resto.
        </p>
      )}
    </div>
  );
}
