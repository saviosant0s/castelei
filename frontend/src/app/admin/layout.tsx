import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s · Painel do Castelei" },
  // O painel não é vitrine: fora do índice dos buscadores.
  robots: { index: false, follow: false },
};

/*
| A moldura do painel de conteúdo.
|
| É a única parte do Castelei pensada para tela grande: aqui se escreve e se
| confere conteúdo, não se estuda. Por isso não tem a barra de baixo nem o
| limite estreito do app — quem usa está sentado, com teclado.
|
| A guarda de acesso não mora aqui, e sim em (painel)/layout.tsx. Assim
| /admin/entrar fica de fora dela: uma tela de login atrás de uma tranca de
| login não deixaria ninguém entrar nunca.
*/
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface">
      <header className="border-b border-ink/10 bg-surface-raised">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/admin" className="select-none font-display text-xl font-bold">
            Castelei <span className="text-content-subtle">· painel</span>
          </Link>
          <Link href="/inicio" className="text-base text-content-secondary underline underline-offset-4">
            Voltar ao app
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
