export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors: Record<string, string[]> = {},
  ) {
    super(message);
  }
}

/** POST JSON para as rotas do próprio Next (`/api/...`). */
export async function postJson<T>(url: string, body?: unknown): Promise<T> {
  return sendJson<T>("POST", url, body);
}

/** PUT JSON: guardar algo que substitui o anterior (a anotação da lição). */
export async function putJson<T>(url: string, body?: unknown): Promise<T> {
  return sendJson<T>("PUT", url, body);
}

/** GET JSON das rotas do próprio Next. */
export async function getJson<T>(url: string): Promise<T> {
  return sendJson<T>("GET", url);
}

async function sendJson<T>(method: "GET" | "POST" | "PUT", url: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: method === "GET" ? { Accept: "application/json" } : { "Content-Type": "application/json", Accept: "application/json" },
      body: method === "GET" ? undefined : JSON.stringify(body ?? {}),
    });
  } catch {
    throw new ApiError("Sem conexão. Confira sua internet e tente de novo.", 0);
  }

  const data = await response.json().catch(() => null);

  if (response.status === 401 && typeof window !== "undefined" && !url.startsWith("/api/auth/")) {
    // Rota de API (limpa o cookie e redireciona), não uma página: navegação completa é o certo aqui.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/api/auth/expired";
  }
  if (!response.ok) {
    throw new ApiError(data?.message ?? "Algo deu errado. Tente de novo.", response.status, data?.errors ?? {});
  }
  return data as T;
}

export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Algo deu errado. Tente de novo.";
}
