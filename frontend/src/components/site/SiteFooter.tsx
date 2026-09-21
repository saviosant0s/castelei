import Link from "next/link";
import { CastleMark } from "@/components/Logo";

/*
| Rodapé do site público.
|
| No celular o cabeçalho esconde a navegação para não virar um amontoado de
| links; o rodapé é quem garante que toda página pública continue alcançável.
| Por isso ele é completo, e não decorativo.
*/
interface Column {
  title: string;
  links: { href: string; label: string }[];
}

export function SiteFooter({ guest }: { guest: boolean }) {
  const columns: Column[] = [
    {
      title: "O app",
      links: [
        { href: "/como-funciona", label: "Como funciona" },
        { href: "/materias", label: "Matérias" },
        { href: "/#planos", label: "Planos" },
      ],
    },
    {
      title: "Sua conta",
      links: guest
        ? [
            { href: "/inicio", label: "Abrir o app" },
            { href: "/excluir-conta", label: "Excluir sua conta" },
          ]
        : [
            { href: "/cadastro", label: "Criar conta" },
            { href: "/entrar", label: "Entrar" },
            { href: "/excluir-conta", label: "Excluir sua conta" },
          ],
    },
    {
      title: "Transparência",
      links: [{ href: "/privacidade", label: "Política de Privacidade" }],
    },
  ];

  return (
    <footer className="mt-24 border-t border-ink/10 bg-surface-sunken">
      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-4">
          <div>
            <span className="inline-flex items-center gap-2.5">
              <CastleMark className="size-8" />
              <span className="font-display text-xl font-bold tracking-tight">Castelei</span>
            </span>
            <p className="mt-3 max-w-xs text-sm text-content-secondary">
              Estudo para provas, com o assunto e a língua da prova na mesma lição.
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="label-mono">{column.title}</h2>
              <ul className="mt-3 space-y-1">
                {column.links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="inline-flex min-h-11 items-center text-base text-content-secondary transition hover:text-ink"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="mt-10 border-t border-ink/10 pt-6 text-sm text-content-subtle">
          Castelei · Projeto independente, feito no Brasil{guest ? " · modo de teste" : ""}.
        </p>
      </div>
    </footer>
  );
}
