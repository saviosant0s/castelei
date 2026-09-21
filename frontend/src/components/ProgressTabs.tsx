"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/*
| Controle segmentado: o jeito nativo de dividir um assunto em abas sem
| gastar um item da barra de baixo. Cada aba é uma rota de verdade, então
| o botão "voltar" do Android funciona e dá para compartilhar o link.
*/
const tabs = [
  { href: "/progresso", label: "Resumo" },
  { href: "/progresso/evolucao", label: "Evolução" },
  { href: "/progresso/conquistas", label: "Conquistas" },
];

export function ProgressTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Seções do progresso">
      <ul className="flex gap-1 rounded-pill bg-surface-sunken p-1">
        {tabs.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center justify-center rounded-pill px-2 text-base transition select-none ${
                  active ? "bg-surface-raised font-bold shadow-lift" : "text-content-secondary"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
