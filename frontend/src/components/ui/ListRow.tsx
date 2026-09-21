import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "./Card";

/**
 * Linha de lista navegável: lição dentro da matéria, e o que vier depois.
 *
 * A área toda é clicável, com altura bem acima dos 44px mínimos de toque —
 * mirar num link pequeno no celular é o tipo de fricção que faz desistir.
 */
interface ListRowProps {
  href: string;
  /** Selo à esquerda: o número da lição, um ícone. */
  leading?: ReactNode;
  title: string;
  meta?: ReactNode;
}

export function ListRow({ href, leading, title, meta }: ListRowProps) {
  return (
    <Card href={href} size="sm" className="flex items-center gap-4">
      {leading && (
        <span className="grid size-11 shrink-0 place-items-center rounded-control bg-surface-sunken font-mono text-base font-medium">
          {leading}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-bold">{title}</span>
        {meta && <span className="block text-sm text-content-subtle">{meta}</span>}
      </span>
      <ChevronRight className="size-5 shrink-0 text-content-faint" aria-hidden={true} />
    </Card>
  );
}
