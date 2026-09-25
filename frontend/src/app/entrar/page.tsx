import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { Logo } from "@/components/Logo";
import { Callout } from "@/components/ui";
import { currentUser } from "@/lib/backend";
import { isGuestMode } from "@/lib/proxy";

export const metadata: Metadata = { title: "Entrar" };

// Depende do cookie e da variável GUEST_MODE, lidos a cada requisição.
export const dynamic = "force-dynamic";

/*
| Entrar vale também no modo de teste. É o caminho de quem criou a conta no
| celular e agora abre o app no computador: sem esta tela, o modo de teste
| daria a ele um visitante novo e vazio, e o histórico ficaria no outro
| aparelho.
*/
export default async function Page() {
  const user = await currentUser();
  if (user && !user.is_guest) redirect("/inicio");

  const visitante = user?.is_guest === true;

  return (
    <main className="mx-auto min-h-dvh max-w-md px-6 pb-12 pt-6">
      <Link href="/" aria-label="Página inicial do Castelei"><Logo /></Link>
      <h1 className="mt-12 text-4xl">Bem-vindo de volta</h1>
      <p className="mt-3 text-base text-content-secondary">Entre para continuar de onde parou.</p>

      {visitante && (
        <div className="mt-6">
          <Callout role="info">
            O que você estudou <strong>sem conta</strong> neste navegador não vai para a conta em que você entrar.
            Para guardar esse progresso,{" "}
            <Link href="/cadastro" className="font-bold underline underline-offset-4">
              crie a conta a partir dele
            </Link>
            .
          </Callout>
        </div>
      )}

      <div className="mt-8">
        <AuthForm mode="login" />
      </div>

      {isGuestMode() && (
        <p className="mt-6 text-center text-base">
          <Link href="/inicio" className="font-bold text-content-secondary underline underline-offset-4">
            Continuar sem conta
          </Link>
        </p>
      )}
    </main>
  );
}
