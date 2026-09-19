import { NextResponse, type NextRequest } from "next/server";
import { TOKEN_COOKIE } from "@/lib/proxy";

/** Sessão inválida: limpa o cookie e volta para o login. */
export function GET(req: NextRequest) {
  const out = NextResponse.redirect(new URL("/entrar", req.url));
  out.cookies.delete(TOKEN_COOKIE);
  return out;
}
