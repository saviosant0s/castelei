import { NextResponse, type NextRequest } from "next/server";

/** Nome do cookie httpOnly que guarda o token da API. O JavaScript do navegador nunca o vê. */
export const TOKEN_COOKIE = "castelei_token";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export function apiBase(): string {
  return (process.env.API_URL ?? "http://localhost:8000/api").replace(/\/+$/, "");
}

/** Só estas rotas da API podem ser chamadas pelo navegador via proxy. */
const ALLOWED_PATHS = [
  /^lessons\/\d+\/attempts$/,
  /^attempts\/\d+\/answers$/,
  /^attempts\/\d+\/finish$/,
];

export function isAllowedPath(path: string): boolean {
  return ALLOWED_PATHS.some((pattern) => pattern.test(path));
}

function json(body: unknown, status: number): NextResponse {
  return NextResponse.json(body, { status });
}

/** Repassa a chamada do navegador para a API, colocando o token do cookie no header. */
export async function forwardToBackend(req: NextRequest, segments: string[]): Promise<NextResponse> {
  const path = segments.join("/");
  if (!isAllowedPath(path)) return json({ message: "Não encontrado." }, 404);

  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) return json({ message: "Sua sessão expirou. Entre de novo." }, 401);

  const rawBody = await req.text();

  let response: Response;
  try {
    response = await fetch(`${apiBase()}/${path}`, {
      method: req.method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: rawBody === "" ? "{}" : rawBody,
      cache: "no-store",
    });
  } catch {
    return json({ message: "Não deu para falar com o servidor. Tente de novo em instantes." }, 502);
  }

  const out = new NextResponse(await response.text(), {
    status: response.status,
    headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" },
  });
  if (response.status === 401) out.cookies.delete(TOKEN_COOKIE);
  return out;
}

/** Login e cadastro: troca o token da API por um cookie httpOnly e devolve só o usuário. */
export async function authenticate(req: NextRequest, endpoint: "login" | "register"): Promise<NextResponse> {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json({ message: "Requisição inválida." }, 400);
  }

  let response: Response;
  try {
    response = await fetch(`${apiBase()}/${endpoint}`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    return json({ message: "Não deu para falar com o servidor. Tente de novo em instantes." }, 502);
  }

  const data = (await response.json().catch(() => null)) as { user?: unknown; token?: string } | null;

  if (!response.ok || !data?.token) {
    // Erros de validação (422) e afins seguem para a tela do jeito que a API mandou.
    return json(data ?? { message: "Algo deu errado. Tente de novo." }, response.ok ? 502 : response.status);
  }

  const out = json({ user: data.user }, response.status);
  out.cookies.set(TOKEN_COOKIE, data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
  return out;
}

/** Revoga o token na API (se possível) e apaga o cookie. */
export async function logout(req: NextRequest): Promise<NextResponse> {
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  if (token) {
    try {
      await fetch(`${apiBase()}/logout`, {
        method: "POST",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
    } catch {
      // Sem problema: o cookie some do mesmo jeito.
    }
  }
  const out = json({ ok: true }, 200);
  out.cookies.delete(TOKEN_COOKIE);
  return out;
}
