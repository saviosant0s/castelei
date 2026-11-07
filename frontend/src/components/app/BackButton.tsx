import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/*
| O "voltar" das telas de dentro (área, trilha, matéria, as do Perfil): mora
| no cabeçalho fixo, no lugar do selo da área.
|
| Pedido do Sávio: o link "← Início" solto embaixo do cabeçalho tinha cara de
| site. Em aplicativo o voltar fica na barra de cima, sempre no mesmo canto,
| e diz para onde leva. Tem a mesma cara do selo da área, que é quem ele
| substitui: a barra não muda de forma entre uma tela e outra.
|
| Quem decide se ele aparece é o slot `@voltar` do layout do app, uma página
| por tela. O `data-voltar` é o que esconde o selo da área (`:has()` no
| AppBar), então o placeholder do carregamento também o leva.
*/
export function BackButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      data-voltar=""
      aria-label={`Voltar para ${label}`}
      className="inline-flex h-9 min-w-0 items-center gap-1 rounded-pill bg-surface-raised pr-3.5 pl-1.5 text-sm font-bold shadow-lift"
    >
      <ChevronLeft className="size-5 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

/** Enquanto a tela de destino carrega: a seta já no lugar, o nome chega junto com a página. */
export function BackPlaceholder() {
  return (
    <span
      data-voltar=""
      aria-hidden="true"
      className="inline-flex h-9 items-center rounded-pill bg-surface-raised pr-3 pl-1.5 text-content-faint shadow-lift"
    >
      <ChevronLeft className="size-5" />
      <span className="h-3 w-14 animate-pulse rounded-full bg-ink/10" />
    </span>
  );
}
