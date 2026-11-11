import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface AreaTileProps {
  href: string;
  name: string;
  icon: LucideIcon;
  /** A posição na grade: escolhe a cor da peça, em rodízio. */
  index: number;
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
/*
| A peça inteira leva a cor, e não só o ícone. Quatorze peças brancas iguais
| eram uma parede: a cor dá a cada área um rosto e deixa a grade viva. São
| as três cores da marca em rodízio (nunca vermelho, que quer dizer erro),
| com a diagonal alternando para duas vizinhas não saírem iguais.
*/
const cores = [
  { peca: "bg-sky-soft", icone: "text-sky", barra: "bg-sky" },
  { peca: "bg-coral-soft", icone: "text-coral", barra: "bg-coral" },
  { peca: "bg-sage-soft", icone: "text-sage", barra: "bg-sage" },
];

export function AreaTile({ href, name, icon: Icon, index, practiced, total }: AreaTileProps) {
  const percent = total > 0 ? Math.round((practiced / total) * 100) : 0;
  const cor = cores[index % cores.length];

  return (
    <Link
      href={href}
      aria-label={`${name}: ${practiced} de ${total} lições praticadas`}
      className={`flex h-full items-center gap-2.5 rounded-card px-3 py-3.5 transition hover:-translate-y-0.5 active:translate-y-0.5 ${cor.peca}`}
    >
      <span className={`grid size-10 shrink-0 place-items-center rounded-control bg-surface-raised shadow-lift ${cor.icone}`}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[15px] leading-tight font-bold">{name}</span>
        {/* Barra e número juntos: barra sozinha obriga a medir a olho. */}
        <span className="mt-1.5 flex items-center gap-1.5" aria-hidden="true">
          <span className="h-1.5 flex-1 overflow-hidden rounded-pill bg-surface-raised">
            <span className={`block h-full rounded-pill ${cor.barra}`} style={{ width: `${percent}%` }} />
          </span>
          <span className="font-mono text-[11px] leading-none tabular-nums text-content-secondary">
            {practiced}/{total}
          </span>
        </span>
      </span>
    </Link>
  );
}
