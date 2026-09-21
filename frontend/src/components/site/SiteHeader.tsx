import Link from "next/link";
import { Logo } from "@/components/Logo";

/*
| Cabeçalho do site público.
|
| Aqui é o contrário do app: isto É um site, e um site tem cabeçalho fixo com
| navegação. A moldura de app (barra de baixo, abas) começa em /inicio.
|
| A chamada muda conforme quem chega: visitante de primeira viagem recebe um
| convite, quem já tem sessão recebe o caminho de volta. Nada de "Entrar" para
| quem já entrou.
|
| Quem decide isso é o layout, que lê o cookie uma vez só e conta para o
| cabeçalho e para o rodapé.
*/
const links = [
  { href: "/como-funciona", label: "Como funciona" },
  { href: "/materias", label: "Matérias" },
];

export function SiteHeader({ loggedIn }: { loggedIn: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-surface/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-3 sm:px-6">
        <Link href="/" aria-label="Castelei, página inicial">
          <Logo />
        </Link>

        <nav aria-label="Seções do site" className="ml-4 hidden items-center gap-1 sm:flex">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex min-h-11 items-center rounded-control px-3 text-base text-content-secondary transition hover:bg-ink/5 hover:text-ink"
            >
              {label}
            </Link>
          ))}
        </nav>

        <Link href={loggedIn ? "/inicio" : "/cadastro"} className="btn btn-primary ml-auto min-h-11 px-5">
          {loggedIn ? "Abrir o app" : "Começar grátis"}
        </Link>
      </div>
    </header>
  );
}
