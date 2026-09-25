import { NextResponse, type NextRequest } from "next/server";
import { createGuestSession, isGuestMode, sessionCookieOptions, TOKEN_COOKIE } from "@/lib/proxy";

/**
 * Telas do app exigem sessão. Sem cookie:
 * - modo normal: vai para o login;
 * - modo de teste (GUEST_MODE=true): cria uma conta de visitante e segue.
 * (A API valida o token de verdade.)
 */
export async function proxy(req: NextRequest) {
  if (req.cookies.get(TOKEN_COOKIE)?.value) return NextResponse.next();

  if (!isGuestMode()) {
    return NextResponse.redirect(new URL("/entrar", req.url));
  }

  const token = await createGuestSession();
  if (!token) {
    // Não seguimos sem sessão: evita laço de redirecionamentos se a API estiver fora do ar.
    return new NextResponse("O servidor está indisponível no momento. Tente de novo em instantes.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  // O cookie vale já nesta requisição (para as telas) e fica salvo no navegador.
  req.cookies.set(TOKEN_COOKIE, token);
  const res = NextResponse.next({ request: { headers: req.headers } });
  res.cookies.set(TOKEN_COOKIE, token, sessionCookieOptions());
  return res;
}

export const config = {
  matcher: ["/inicio/:path*", "/area/:path*", "/materia/:path*", "/licao/:path*", "/progresso/:path*", "/perfil/:path*", "/planos/:path*", "/revisar/:path*", "/buscar/:path*"],
};
