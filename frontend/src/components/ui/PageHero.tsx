import type { ReactNode } from "react";

/*
| O topo das telas principais: rótulo, título e uma frase, CENTRALIZADOS.
|
| Pedido do Sávio: alinhado à esquerda, o topo tinha cara de página de site.
| Centralizado na tela inicial ficou bom, e ele pediu a mesma ideia em toda
| tela parecida — uma peça só, para elas não divergirem.
|
| Título comprido desce um tamanho: "Matemática do dia a dia" em 4xl partia
| em "Matemática do dia a / dia". Com 3xl e o `text-wrap: balance` dos
| títulos, cabe numa linha ou quebra em duas linhas parecidas.
*/
export function PageHero({
  eyebrow,
  title,
  art,
  children,
  className = "",
}: {
  eyebrow?: ReactNode;
  title: string;
  art?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`text-center ${className}`}>
      {art && <div className="mx-auto mb-3 flex w-fit justify-center">{art}</div>}
      {eyebrow && <div className="label-mono">{eyebrow}</div>}
      <h1 className={`mt-1 ${title.length > 18 ? "text-3xl" : "text-4xl"}`}>{title}</h1>
      {children && <div className="mx-auto mt-2 max-w-sm text-base text-balance text-content-secondary">{children}</div>}
    </header>
  );
}
