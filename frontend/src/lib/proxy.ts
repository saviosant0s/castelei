import { NextResponse, type NextRequest } from "next/server";

/** Nome do cookie httpOnly que guarda o token da API. O JavaScript do navegador nunca o vê. */
export const TOKEN_COOKIE = "castelei_token";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

/** Modo de teste: sem tela de login. Cada navegador ganha uma conta de visitante automaticamente. */
export function isGuestMode(): boolean {
  return process.env.GUEST_MODE === "true";
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: THIRTY_DAYS,
  };
}

/** Cria uma conta anônima na API e devolve o token (ou null se a API falhar). */
export async function createGuestSession(): Promise<string | null> {
  try {
    const response = await fetch(`${apiBase()}/register`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Visitante",
        email: `guest-${crypto.randomUUID()}@guest.invalid`,
        password: `${crypto.randomUUID()}${crypto.randomUUID()}`,
      }),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json().catch(() => null)) as { token?: string } | null;
    return data?.token ?? null;
  } catch {
    return null;
  }
}

export function apiBase(): string {
  return (process.env.API_URL ?? "http://localhost:8000/api").replace(/\/+$/, "");
}

/** Só estas rotas da API podem ser chamadas pelo navegador via proxy. */
const ALLOWED_PATHS = [
  /^lessons\/\d+\/attempts$/,
  /^subjects\/\d+\/exams$/,
  /^attempts\/\d+\/answers$/,
  /^attempts\/\d+\/finish$/,
  // Produção textual: conferir o texto (língua + modelo) e, com chave, a correção por IA.
  /^attempts\/\d+\/writing\/(check|review)$/,
  // Lembretes: o interruptor do Perfil assina e desassina o aparelho daqui.
  /^push\/key$/,
  /^push\/subscriptions$/,
];

export function isAllowedPath(path: string): boolean {
  return ALLOWED_PATHS.some((pattern) => pattern.test(path));
}

function json(body: unknown, status: number): NextResponse {
  return NextResponse.json(body, { status });
}

/**
 * Repassa as chamadas do painel de conteúdo (`/api/admin/...`).
 *
 * Separado do `forwardToBackend` de propósito, porque a natureza do tráfego é
 * outra: aqui passam PUT e DELETE, e o corpo pode ser um arquivo de vídeo em
 * vez de JSON. O que não muda é o essencial — o token continua só no cookie
 * httpOnly, e o navegador continua sem nunca falar com a API direto.
 *
 * Quem barra de verdade é a API (middleware `admin`). Este caminho é o
 * encanamento, não a tranca: repassar não é autorizar.
 */
export async function forwardAdmin(req: NextRequest, segments: string[]): Promise<NextResponse> {
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) return json({ message: "Sua sessão expirou. Entre de novo." }, 401);

  const path = segments.join("/");
  const search = new URL(req.url).search;

  const headers: Record<string, string> = { Accept: "application/json", Authorization: `Bearer ${token}` };

  /*
  | O content-type original é repassado tal e qual, e nunca inventado aqui.
  | Num envio de arquivo ele carrega a fronteira entre as partes
  | (`boundary=...`); reescrever o cabeçalho deixaria o PHP sem saber onde um
  | arquivo termina e o próximo começa.
  */
  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;

  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  let response: Response;
  try {
    response = await fetch(`${apiBase()}/admin/${path}${search}`, {
      method: req.method,
      headers,
      body: hasBody ? Buffer.from(await req.arrayBuffer()) : undefined,
      cache: "no-store",
    });
  } catch {
    return json({ message: "Não deu para falar com o servidor. Tente de novo em instantes." }, 502);
  }

  // O modelo de conteúdo vem como download, não como JSON: o corpo passa
  // inteiro, junto com o cabeçalho que dá nome ao arquivo.
  const out = new NextResponse(response.body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json",
      ...(response.headers.get("content-disposition")
        ? { "Content-Disposition": response.headers.get("content-disposition") as string }
        : {}),
    },
  });

  if (response.status === 401) out.cookies.delete(TOKEN_COOKIE);
  return out;
}

/** Repassa a chamada do navegador para a API, colocando o token do cookie no header. */
export async function forwardToBackend(req: NextRequest, segments: string[]): Promise<NextResponse> {
  const path = segments.join("/");
  if (!isAllowedPath(path)) return json({ message: "Não encontrado." }, 404);

  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) return json({ message: "Sua sessão expirou. Entre de novo." }, 401);

  /*
  | GET não leva corpo, e isso não é detalhe de estilo: o `fetch` do Node
  | RECUSA um GET com corpo, então mandar "{}" às cegas derrubaria a chamada
  | com um erro que chega aqui como 502 e parece problema de rede.
  */
  const semCorpo = req.method === "GET" || req.method === "HEAD";
  const rawBody = semCorpo ? "" : await req.text();

  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
  if (!semCorpo) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`${apiBase()}/${path}`, {
      method: req.method,
      headers,
      body: semCorpo ? undefined : rawBody === "" ? "{}" : rawBody,
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
  out.cookies.set(TOKEN_COOKIE, data.token, sessionCookieOptions());
  return out;
}

/**
 * Apaga a conta na API e derruba a sessão. Diferente do logout, aqui o erro
 * importa: se a API recusar, o cookie fica — apagá-lo daria a impressão de
 * que a conta sumiu quando ela continua lá.
 */
export async function deleteAccount(req: NextRequest): Promise<NextResponse> {
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) return json({ message: "Sua sessão expirou. Entre de novo." }, 401);

  let response: Response;
  try {
    response = await fetch(`${apiBase()}/me`, {
      method: "DELETE",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return json({ message: "Não deu para falar com o servidor. Tente de novo em instantes." }, 502);
  }

  if (!response.ok) {
    return json({ message: "Não foi possível excluir a conta agora. Tente de novo em instantes." }, response.status);
  }

  const out = json({ ok: true }, 200);
  out.cookies.delete(TOKEN_COOKIE);
  return out;
}

/**
 * O visitante vira conta de verdade: o mesmo usuário ganha nome, e-mail e
 * senha, e leva todo o histórico junto. O token não muda, então o cookie
 * também não precisa mudar.
 */
export async function claimAccount(req: NextRequest): Promise<NextResponse> {
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) return json({ message: "Sua sessão expirou. Recarregue a página." }, 401);

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json({ message: "Requisição inválida." }, 400);
  }

  let response: Response;
  try {
    response = await fetch(`${apiBase()}/me/claim`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    return json({ message: "Não deu para falar com o servidor. Tente de novo em instantes." }, 502);
  }

  const data = await response.json().catch(() => null);
  return json(data ?? { message: "Algo deu errado. Tente de novo." }, response.status);
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
