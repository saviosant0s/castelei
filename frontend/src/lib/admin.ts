import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiBase, TOKEN_COOKIE } from "@/lib/proxy";

/** Quem é a pessoa logada, do ponto de vista do painel. */
export type AdminSession =
  | { state: "anonima" }
  | { state: "sem-permissao"; name: string; email: string }
  | { state: "ok"; name: string; email: string };

async function apiGet(path: string, token: string): Promise<Response | null> {
  try {
    return await fetch(`${apiBase()}${path}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

/**
 * Lê a sessão e diz o que o painel deve fazer com ela.
 *
 * Devolve os três casos em vez de redirecionar sozinho, porque eles pedem
 * telas diferentes: sem sessão vai para o login, sem permissão precisa de uma
 * explicação (e de uma saída para entrar com outra conta), e só o terceiro
 * abre o painel. Mandar todo mundo para o login deixaria quem está logado
 * numa volta sem fim — entra, é barrado, volta para o login já logado.
 *
 * O modo de teste (GUEST_MODE) não vale aqui: a conta de visitante nasce sem
 * permissão nenhuma, e o painel escreve no conteúdo que todos os alunos veem.
 */
export async function adminSession(): Promise<AdminSession> {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) return { state: "anonima" };

  const response = await apiGet("/me", token);
  if (!response || !response.ok) return { state: "anonima" };

  const { user } = (await response.json()) as { user: { name: string; email: string; is_admin: boolean } };

  return {
    state: user.is_admin ? "ok" : "sem-permissao",
    name: user.name,
    email: user.email,
  };
}

/** GET numa rota do painel, para Server Components. */
export async function adminGet<T>(path: string): Promise<T> {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) redirect("/admin/entrar");

  const response = await apiGet(`/admin${path}`, token);

  if (!response) throw new Error("Não deu para falar com o servidor. Tente de novo em instantes.");
  if (response.status === 401) redirect("/admin/entrar");
  if (response.status === 404) throw new Error("Este conteúdo não existe mais. Talvez tenha sido apagado.");
  if (!response.ok) throw new Error(`Não foi possível carregar esta página (erro ${response.status}).`);

  return (await response.json()) as T;
}
