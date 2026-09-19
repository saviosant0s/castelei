import { NextResponse, type NextRequest } from "next/server";
import { TOKEN_COOKIE } from "@/lib/proxy";

/** Telas do app exigem sessão; sem cookie, vai para o login. (A API valida o token de verdade.) */
export function proxy(req: NextRequest) {
  if (!req.cookies.get(TOKEN_COOKIE)?.value) {
    return NextResponse.redirect(new URL("/entrar", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/inicio/:path*", "/materia/:path*", "/licao/:path*", "/progresso/:path*", "/perfil/:path*", "/planos/:path*"],
};
