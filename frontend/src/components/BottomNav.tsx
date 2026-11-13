"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, House, ListChecks, User, Users } from "lucide-react";

/*
| Quatro abas. Revisar ganhou a sua (pedido do Sávio): é o hábito de todo
| dia, e morava escondido num sininho no topo da tela inicial. O número é o
| de revisões vencidas, em coral — nunca vermelho, porque atrasar uma
| revisão não é erro.
|
| Turmas entrou no lugar de Progresso (pedido do Sávio, novembro de 2026), e o
| Progresso foi morar no Perfil, que é onde fica o "você": os números, as
| conquistas e os ajustes. Os endereços de /progresso não mudaram; ali, a aba
| acesa é a do Perfil.
*/
const items = [
  { href: "/inicio", label: "Início", icon: House },
  // Treinar fora da trilha: a matéria, a lição e, no Pro, o nível (novembro de 2026).
  { href: "/questoes", label: "Questões", icon: ListChecks },
  { href: "/revisar", label: "Revisar", icon: History },
  { href: "/turmas", label: "Turmas", icon: Users },
  { href: "/perfil", label: "Perfil", icon: User },
];

function ativa(href: string, pathname: string): boolean {
  if (pathname === href || pathname.startsWith(`${href}/`)) return true;
  if (href === "/inicio") return ["/area", "/trilha", "/materia", "/licao"].some((p) => pathname.startsWith(p));
  if (href === "/perfil") return ["/progresso", "/correcoes", "/buscar", "/planos"].some((p) => pathname.startsWith(p));
  return false;
}

export function BottomNav({ reviewsDue = 0 }: { reviewsDue?: number }) {
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
          const active = ativa(href, pathname);
          const badge = href === "/revisar" && reviewsDue > 0 ? reviewsDue : 0;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={badge ? `${label}, ${badge} ${badge === 1 ? "vencida" : "vencidas"}` : undefined}
                className="flex min-h-16 select-none flex-col items-center justify-start gap-1.5 text-sm"
              >
                <span className={`relative grid h-8 w-14 place-items-center rounded-full transition ${active ? "bg-surface-bold text-on-bold" : "text-ink/70"}`}>
                  <Icon className="size-5" aria-hidden="true" />
                  {badge > 0 && (
                    <span className="absolute -top-1 right-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-pill bg-coral px-1 font-display text-[0.6875rem] font-bold text-on-accent">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
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
