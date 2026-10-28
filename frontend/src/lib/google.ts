import type { NextRequest } from "next/server";

/*
| Entrar com o Google, do lado do Next.
|
| O navegador nunca fala com a API, e aqui não é diferente: ele vai ao Google,
| o Google devolve um código para uma rota NOSSA (callback), e é o servidor do
| Next que entrega esse código ao Laravel. Quem troca o código pela identidade
| é o Laravel, com o segredo do cliente, que só ele tem.
|
| O `client_id` não é segredo (aparece no endereço do Google), por isso mora
| também aqui: é ele que decide se o botão aparece. Sem ele, não há botão.
*/

export const STATE_COOKIE = "castelei_google_state";

export function googleEnabled(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim());
}

/** Tem que ser idêntico ao cadastrado no Google Cloud, caractere por caractere. */
export function googleRedirectUri(req: NextRequest): string {
  return `${req.nextUrl.origin}/api/auth/google/callback`;
}

export function googleAuthUrl(req: NextRequest, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID?.trim() ?? "",
    redirect_uri: googleRedirectUri(req),
    response_type: "code",
    scope: "openid email profile",
    state,
    // Mostra a escolha de conta: quem tem duas contas Google não entra na errada sem ver.
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}
