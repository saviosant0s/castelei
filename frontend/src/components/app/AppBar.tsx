import Link from "next/link";
import { createElement } from "react";
import { CastleMark } from "@/components/Logo";
import { AppBarStats } from "./AppBarStats";
import { areaIcon } from "@/lib/areas";
import type { AppBarResponse } from "@/lib/types";

/*
| O cabeçalho fixo do app, em toda tela menos a lição.
|
| Pedido do Sávio: os dias seguidos e o XP ficavam em dois selos soltos
| embaixo do "Oi", com cara de layout quebrado — e XP é algo que a pessoa
| quer ver em qualquer tela, como no Duolingo. À esquerda fica a área que
| ela está estudando (é o atalho para voltar a ela); sem área ainda, a marca.
|
| Sem lupa, de propósito: lupa no topo é cara de site. A busca mora no Perfil.
|
| Nas telas de dentro o canto esquerdo vira o "voltar" (`voltar`, o slot
| `@voltar` do layout). Ele chega pronto do servidor, e o `:has()` esconde o
| selo quando há um voltar na barra: sem JavaScript decidindo depois da
| hidratação, o selo não pisca antes de virar seta.
*/
export function AppBar({ bar, voltar }: { bar: AppBarResponse | null; voltar?: React.ReactNode }) {
  const gami = bar?.gamification ?? null;
  const area = bar?.area ?? null;

  return (
    <header
      className="fixed inset-x-0 top-0 z-30 border-b border-ink/10 bg-surface/90 backdrop-blur"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="group/bar mx-auto flex h-14 max-w-md items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center">
          {voltar}
          <div className="flex min-w-0 group-has-[[data-voltar]]/bar:hidden">
            {area ? (
              <Link
                href={`/area/${area.slug}`}
                className="inline-flex h-9 min-w-0 items-center gap-2 rounded-pill bg-surface-raised pr-3.5 pl-1.5 text-sm font-bold shadow-lift"
                aria-label={`Estudando ${area.name}`}
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-sky-soft text-sky-deep">
                  {createElement(areaIcon(area.slug), { className: "size-4", "aria-hidden": true })}
                </span>
                <span className="truncate">{area.name}</span>
              </Link>
            ) : (
              <Link href="/inicio" aria-label="Início">
                <CastleMark className="size-8" />
              </Link>
            )}
          </div>
        </div>

        {gami && <AppBarStats gami={gami} />}
      </div>
    </header>
  );
}
