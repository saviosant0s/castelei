import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface AreaTileProps {
  href: string;
  name: string;
  icon: LucideIcon;
  tone: string;
  practiced: number;
  total: number;
}

/*
| Uma área na grade da tela inicial.
|
| Pedido do Sávio: com quatorze áreas em lista, uma linha alta por área, a
| tela inicial virou três de rolagem, e quem não rolasse até o fim não sabia
| que Física ou Artes existiam. Em duas colunas de peças baixas o catálogo
| inteiro cabe numa tela e se vê de uma vez.
|
| Não são os cartões altos que já foram recusados aqui (com um vão vazio no
| meio): a peça tem a altura do nome, e o nome quebra em vez de cortar. As
| matérias de cada área ficam para a tela da área, que é a lista.
*/
export function AreaTile({ href, name, icon: Icon, tone, practiced, total }: AreaTileProps) {
  const percent = total > 0 ? Math.round((practiced / total) * 100) : 0;

  return (
    <Link
      href={href}
      aria-label={`${name}: ${practiced} de ${total} lições praticadas`}
      className="flex h-full items-center gap-2.5 rounded-card bg-surface-raised px-3 py-3 shadow-lift transition hover:-translate-y-0.5"
    >
      <span className={`grid size-9 shrink-0 place-items-center rounded-control ${tone}`}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[15px] leading-tight font-bold">{name}</span>
        {/* Barra e número juntos: barra sozinha obriga a medir a olho. */}
        <span className="mt-1.5 flex items-center gap-1.5" aria-hidden="true">
          <span className="h-1.5 flex-1 overflow-hidden rounded-pill bg-ink/10">
            <span className="block h-full rounded-pill bg-ink" style={{ width: `${percent}%` }} />
          </span>
          <span className="font-mono text-[11px] leading-none tabular-nums text-content-subtle">
            {practiced}/{total}
          </span>
        </span>
      </span>
    </Link>
  );
}
