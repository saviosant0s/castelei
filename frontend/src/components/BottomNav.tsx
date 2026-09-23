"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartColumn, House, User } from "lucide-react";

const items = [
  { href: "/inicio", label: "Início", icon: House },
  { href: "/progresso", label: "Progresso", icon: ChartColumn },
  { href: "/perfil", label: "Perfil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-paper"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/*
        A folga de cima é o que separa a barra do conteúdo: sem ela os ícones
        encostam na linha divisória e a barra parece colada na tela.
        O respiro de baixo fica só no <nav> — duplicar aqui empurrava a barra
        inteira no iPhone.
      */}
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-2.5 pb-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            pathname.startsWith(`${href}/`) ||
            (href === "/inicio" && (pathname.startsWith("/materia") || pathname.startsWith("/licao") || pathname.startsWith("/revisar")));
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex min-h-16 select-none flex-col items-center justify-start gap-1.5 text-sm"
              >
                <span className={`grid h-8 w-14 place-items-center rounded-full transition ${active ? "bg-surface-bold text-on-bold" : "text-ink/70"}`}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className={active ? "font-bold" : "text-ink/70"}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
