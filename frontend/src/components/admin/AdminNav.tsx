"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Image as ImageIcon, Upload } from "lucide-react";

const ABAS = [
  { href: "/admin", label: "Matérias", icon: BookOpen },
  { href: "/admin/importar", label: "Importar", icon: Upload },
  { href: "/admin/midia", label: "Mídia", icon: ImageIcon },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Seções do painel" className="flex flex-wrap gap-2">
      {ABAS.map(({ href, label, icon: Icon }) => {
        // "/admin" só acende em /admin exato: senão acenderia em toda tela do painel.
        const atual = href === "/admin" ? pathname === href : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={atual ? "page" : undefined}
            className={`flex select-none items-center gap-2 rounded-pill px-4 py-2 text-base transition ${
              atual ? "bg-surface-bold text-paper" : "bg-surface-sunken text-content-secondary hover:text-content"
            }`}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
