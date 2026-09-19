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
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-paper/95 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href === "/inicio" && (pathname.startsWith("/materia") || pathname.startsWith("/licao")));
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex min-h-16 flex-col items-center justify-center gap-1 text-sm"
              >
                <span className={`grid h-8 w-14 place-items-center rounded-full transition ${active ? "bg-ink text-paper" : "text-ink/70"}`}>
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
