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
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body ?? {}),
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
