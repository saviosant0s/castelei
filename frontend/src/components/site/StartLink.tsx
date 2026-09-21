import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowRight } from "lucide-react";
import { isGuestMode, TOKEN_COOKIE } from "@/lib/proxy";

/**
 * A chamada para ação do site público.
 *
 * Existe para que nenhuma página do site precise decidir sozinha para onde
 * manda a pessoa — e para que ninguém receba "Começar grátis" depois de já
 * ter conta. Quem tem sessão (ou está no modo de teste) volta para o estudo;
 * quem não tem vai criar a conta.
 */
export async function StartLink({
  className = "btn btn-primary",
  arrow = true,
}: {
  className?: string;
  arrow?: boolean;
}) {
  const loggedIn = isGuestMode() || Boolean((await cookies()).get(TOKEN_COOKIE)?.value);

  return (
    <Link href={loggedIn ? "/inicio" : "/cadastro"} className={className}>
      {loggedIn ? "Continuar estudando" : "Começar grátis"}
      {arrow && <ArrowRight className="size-5" aria-hidden="true" />}
    </Link>
  );
}
