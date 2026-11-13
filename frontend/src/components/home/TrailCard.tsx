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
|
| O ícone mora na mesma linha do nome: em cima dele, sozinho, deixava um vão
| no meio do cartão. A contagem vai junto da barra, que é o que ela mede.
*/
export function TrailCard({ href, name, detail, done, total }: TrailCardProps) {
  return (
    <Link
      href={href}
      className="flex h-full flex-col rounded-card bg-surface-raised px-4 py-3.5 shadow-lift transition hover:-translate-y-0.5"
    >
      <span className="flex items-center gap-3">
        <Route className="size-5 shrink-0 text-sky" aria-hidden="true" />
        <span className="min-w-0 flex-1 font-display text-base leading-tight font-bold">{name}</span>
      </span>
      <span className="mt-2 line-clamp-2 flex-1 text-sm text-content-secondary">{detail}</span>
      <span className="mt-2.5 flex items-center gap-2">
        <ProgressBar
          percent={total > 0 ? (done / total) * 100 : 0}
          tone="ink"
          size="sm"
          label={`${name}: ${done} de ${total} passos concluídos`}
          className="flex-1"
        />
        <span className="font-mono text-xs tabular-nums text-content-subtle" aria-hidden="true">
          {done}/{total}
        </span>
      </span>
    </Link>
  );
}
