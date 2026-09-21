import { ApiError } from "@/lib/client";
import type { ContentIssue } from "@/lib/admin-types";

/**
 * Erro vindo do painel que carrega a lista de problemas do conteúdo.
 *
 * Existe porque um arquivo de matéria erra em vários lugares de uma vez, e
 * cada um tem endereço próprio dentro do JSON. Uma frase só — "arquivo
 * inválido" — obrigaria a caçar o erro à mão num arquivo de mil linhas.
 */
export class ContentError extends ApiError {
  constructor(
    message: string,
    status: number,
    public issues: ContentIssue[],
    public hint?: string,
  ) {
    super(message, status);
  }
}

interface Options {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  /** objeto vira JSON; FormData vai como está, para o envio de arquivo funcionar */
  body?: unknown;
}

/** Chama o painel pelo proxy do Next (`/api/admin/...`), que é quem tem o token. */
export async function adminFetch<T>(path: string, { method = "GET", body }: Options = {}): Promise<T> {
  const isForm = body instanceof FormData;

  let response: Response;
  try {
    response = await fetch(`/api/admin${path}`, {
      method,
      // Em FormData o navegador escreve o content-type sozinho, com a fronteira
      // entre as partes. Escrevê-lo aqui quebraria o envio de arquivo.
      headers: isForm ? { Accept: "application/json" } : { Accept: "application/json", "Content-Type": "application/json" },
      body: isForm ? body : body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Sem conexão. Confira sua internet e tente de novo.", 0);
  }

  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;

  if (response.status === 401 && typeof window !== "undefined") {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/admin/entrar";
  }

  if (!response.ok) {
    const message = (data?.message as string) ?? "Algo deu errado. Tente de novo.";
    const issues = (data?.content_errors as ContentIssue[]) ?? [];

    if (issues.length > 0 || data?.hint) {
      throw new ContentError(message, response.status, issues, data?.hint as string | undefined);
    }

    throw new ApiError(message, response.status, (data?.errors as Record<string, string[]>) ?? {});
  }

  return data as T;
}
