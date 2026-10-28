import { NextResponse, type NextRequest } from "next/server";
import { googleAuthUrl, googleEnabled, STATE_COOKIE } from "@/lib/google";

/*
| Começo do "Entrar com o Google": manda a pessoa para o Google.
|
| O `state` é um número sorteado que vai e volta. Guardado num cookie, ele
| prova que quem chega na volta é quem saiu daqui — sem isso, um site
| qualquer poderia mandar alguém de volta com o código de OUTRA conta.
*/
export function GET(req: NextRequest) {
  if (!googleEnabled()) return NextResponse.redirect(new URL("/entrar", req.url));

  const state = crypto.randomUUID();
  const out = NextResponse.redirect(googleAuthUrl(req, state));
  out.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // `lax` e não `strict`: a volta do Google é uma navegação vinda de outro site.
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 600,
  });
  return out;
}
