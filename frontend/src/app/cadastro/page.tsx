import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { GoogleButton, OrDivider } from "@/components/GoogleButton";
import { CastleMark } from "@/components/Logo";
import { currentUser } from "@/lib/backend";
import { googleEnabled } from "@/lib/google";

export const metadata: Metadata = { title: "Criar conta" };

// Depende do cookie de quem abre a página.
export const dynamic = "force-dynamic";

/*
| Criar conta tem dois caminhos, e a pessoa não precisa saber qual é.
|
| Quem já estava estudando como visitante (o modo de teste cria essa conta
| sozinho) cria a conta A PARTIR dela: o mesmo usuário ganha e-mail e senha, e
| o histórico vai junto. Cadastro do zero, nesse caso, deixaria tudo que a
| pessoa estudou preso num visitante que ela nunca mais acessa.
|
| Quem chega sem sessão nenhuma faz o cadastro de sempre.
*/
export default async function Page() {
  const user = await currentUser();
  if (user && !user.is_guest) redirect("/perfil");

  const visitante = user?.is_guest === true;

  return (
    <main className="mx-auto min-h-dvh max-w-md px-6 pb-12 pt-6">
      {/* Marca grande e topo centralizado, como nas telas do app: é a primeira
          tela que a pessoa vê, e alinhada à esquerda tinha cara de formulário de site. */}
      <Link href="/" aria-label="Página inicial do Castelei" className="mx-auto mt-6 block w-fit">
        <CastleMark className="size-16" />
      </Link>
      <h1 className="mt-5 text-center text-4xl">Crie sua conta</h1>
      <p className="mx-auto mt-2 max-w-xs text-center text-base text-balance text-content-secondary">
        {visitante
          ? "Tudo que você já estudou neste navegador vem junto: lições, revisões, streak e conquistas. Depois é só entrar com o e-mail e a senha em qualquer aparelho."
          : "Leva menos de um minuto e é grátis."}
      </p>
      <div className="mt-8">
        {googleEnabled() && (
          <>
            {/* Para o visitante, o Google também leva o histórico junto (AuthController::google). */}
            <GoogleButton label="Criar conta com o Google" />
            <OrDivider />
          </>
        )}
        <AuthForm mode={visitante ? "claim" : "register"} />
      </div>
    </main>
  );
}
