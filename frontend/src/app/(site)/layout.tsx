import { cookies } from "next/headers";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { isGuestMode, TOKEN_COOKIE } from "@/lib/proxy";

/*
| O site público: tudo que abre sem login.
|
| Fica num grupo de rota — os parênteses não entram na URL, então /privacidade
| continua /privacidade. O que o grupo dá é a moldura: cabeçalho e rodapé
| iguais em toda página pública, e um lugar só para ler a sessão.
|
| A Play Store exige que /privacidade e /excluir-conta abram sem login. Elas
| moram aqui pelo mesmo motivo que a página de vitrine mora.
*/
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const guest = isGuestMode();
  const loggedIn = guest || Boolean((await cookies()).get(TOKEN_COOKIE)?.value);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader loggedIn={loggedIn} />
      <div className="flex-1">{children}</div>
      <SiteFooter guest={guest} />
    </div>
  );
}
