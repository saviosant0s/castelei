import { NextResponse, type NextRequest } from "next/server";
import { googleRedirectUri, STATE_COOKIE } from "@/lib/google";
import { apiBase, sessionCookieOptions, TOKEN_COOKIE } from "@/lib/proxy";

/*
| Volta do Google. Confere o `state`, entrega o código ao Laravel e grava a
| sessão no mesmo cookie httpOnly de sempre.
|
| O token do visitante vai junto, se houver: é assim que o Laravel sabe que
| deve transformar ESTE visitante na conta Google, sem perder o que ele
| estudou (ver AuthController::google).
*/
export async function GET(req: NextRequest) {
  const falhou = () => {
    const out = NextResponse.redirect(new URL("/entrar?erro=google", req.url));
    out.cookies.delete({ name: STATE_COOKIE, path: "/api/auth/google" });
    return out;
  };

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const esperado = req.cookies.get(STATE_COOKIE)?.value;
  if (!code || !state || !esperado || state !== esperado) return falhou();

  const headers: Record<string, string> = { Accept: "application/json", "Content-Type": "application/json" };
  const atual = req.cookies.get(TOKEN_COOKIE)?.value;
  if (atual) headers.Authorization = `Bearer ${atual}`;

  let data: { token?: string } | null = null;
  try {
    const response = await fetch(`${apiBase()}/auth/google`, {
      method: "POST",
      headers,
      body: JSON.stringify({ code, redirect_uri: googleRedirectUri(req) }),
      cache: "no-store",
    });
    data = response.ok ? ((await response.json().catch(() => null)) as { token?: string } | null) : null;
  } catch {
    data = null;
  }
  if (!data?.token) return falhou();

  // Passa por /entrar/google, que apaga as páginas guardadas da conta anterior.
  const out = NextResponse.redirect(new URL("/entrar/google", req.url));
  out.cookies.set(TOKEN_COOKIE, data.token, sessionCookieOptions());
  out.cookies.delete({ name: STATE_COOKIE, path: "/api/auth/google" });
  return out;
}
