import { NextResponse, type NextRequest } from "next/server";
import { createGuestSession, isGuestMode, sessionCookieOptions, TOKEN_COOKIE } from "@/lib/proxy";

/**
 * Telas do app exigem sessão. Sem cookie:
 * - modo normal: vai para o login;
 * - modo de teste (GUEST_MODE=true): cria uma conta de visitante e segue.
 * (A API valida o token de verdade.)
 *
 * Toda resposta que passa por aqui leva a MARCA DA SESSÃO (`x-castelei-sessao`):
 * um resumo do token, ou "nenhuma". É ela que amarra as páginas guardadas
 * para ler sem internet à conta que as abriu. O service worker apaga o que
 * guardou quando a marca muda (entrou outra conta, por qualquer caminho, até o
 * Google) ou vira "nenhuma" (saiu da conta), e nunca guarda página sem marca.
 * Antes isso dependia de uma tela do cliente chamar a limpeza; agora quem
 * decide é o servidor.
 */
export const SESSAO_HEADER = "x-castelei-sessao";

const SEM_SESSAO = /^\/(entrar|cadastro)(\/|$)/;

export async function marcaDaSessao(token: string | undefined): Promise<string> {
  if (!token) return "nenhuma";
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(bytes).slice(0, 8), (b) => b.toString(16).padStart(2, "0")).join("");
}

function marcar(res: NextResponse, marca: string): NextResponse {
  res.headers.set(SESSAO_HEADER, marca);
  return res;
}

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(TOKEN_COOKIE)?.value;

  // Entrar e Criar conta abrem com ou sem sessão; só levam a marca.
  if (SEM_SESSAO.test(req.nextUrl.pathname)) return marcar(NextResponse.next(), await marcaDaSessao(token));

  if (token) return marcar(NextResponse.next(), await marcaDaSessao(token));

  if (!isGuestMode()) {
    return marcar(NextResponse.redirect(new URL("/entrar", req.url)), "nenhuma");
  }

  const novo = await createGuestSession();
  if (!novo) {
    // Não seguimos sem sessão: evita laço de redirecionamentos se a API estiver fora do ar.
    return new NextResponse("O servidor está indisponível no momento. Tente de novo em instantes.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  // O cookie vale já nesta requisição (para as telas) e fica salvo no navegador.
  req.cookies.set(TOKEN_COOKIE, novo);
  const res = NextResponse.next({ request: { headers: req.headers } });
  res.cookies.set(TOKEN_COOKIE, novo, sessionCookieOptions());
  return marcar(res, await marcaDaSessao(novo));
}

export const config = {
  matcher: [
    "/inicio/:path*", "/area/:path*", "/trilha/:path*", "/materia/:path*", "/licao/:path*", "/progresso/:path*",
    "/perfil/:path*", "/planos/:path*", "/revisar/:path*", "/buscar/:path*", "/turmas/:path*", "/correcoes/:path*",
    "/entrar/:path*", "/cadastro/:path*",
  ],
};
