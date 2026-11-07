import Link from "next/link";
import { Route } from "lucide-react";
import { ProgressBar } from "@/components/ui";

interface TrailCardProps {
  href: string;
  name: string;
  /** "Passo 2 de 8: Programação com Python", ou que terminou. */
  detail: string;
  done: number;
  total: number;
}

/*
| Uma trilha no carrossel da tela inicial.
|
| As trilhas eram uma lista ANTES das áreas, e com seis delas empurravam o
| catálogo para a segunda tela. No carrossel elas ocupam uma faixa só, de
| qualquer tamanho, e o pedaço do cartão seguinte aparecendo na borda é o que
| diz "tem mais para o lado" sem precisar de seta.
*/
export function TrailCard({ href, name, detail, done, total }: TrailCardProps) {
  return (
    <Link
      href={href}
      className="flex h-full flex-col rounded-card bg-surface-raised px-4 py-4 shadow-lift transition hover:-translate-y-0.5"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-control bg-sky-soft text-sky">
          <Route className="size-5" aria-hidden="true" />
        </span>
        <span className="pt-0.5 font-mono text-sm tabular-nums text-content-subtle">
          {done}/{total}
        </span>
      </span>
      <span className="mt-3 font-display text-lg leading-snug font-bold">{name}</span>
      <span className="mt-1 flex-1 text-sm text-content-secondary">{detail}</span>
      <ProgressBar
        percent={total > 0 ? (done / total) * 100 : 0}
        tone="ink"
        size="sm"
        label={`${name}: ${done} de ${total} passos concluídos`}
        className="mt-3"
      />
    </Link>
  );
}
