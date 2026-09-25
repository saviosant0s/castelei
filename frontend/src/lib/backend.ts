import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { apiBase, isGuestMode, TOKEN_COOKIE } from "@/lib/proxy";
import type { User } from "@/lib/types";

/** GET autenticado na API, para Server Components. Manda para o login se a sessão caiu. */
export async function serverGet<T>(path: string): Promise<T> {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) {
    // Em modo de teste não há tela de login para onde mandar a pessoa.
    if (isGuestMode()) throw new Error("Não foi possível iniciar a sessão de teste. Recarregue a página.");
    redirect("/entrar");
  }

  let response: Response;
  try {
    response = await fetch(`${apiBase()}${path}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    throw new Error("Não deu para falar com o servidor. Tente de novo em instantes.");
  }

  if (response.status === 401) redirect("/api/auth/expired");
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error(`Não foi possível carregar esta página (erro ${response.status}).`);

  return (await response.json()) as T;
}

/**
 * Quem está usando o navegador agora, sem redirecionar ninguém.
 *
 * As telas de entrar e de criar conta precisam saber se já existe sessão (e se
 * ela é de visitante) para escolher o formulário certo — mas, sem sessão, a
 * resposta certa é mostrar o formulário, e não mandar para outra tela.
 */
export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) return null;

  try {
    const response = await fetch(`${apiBase()}/me`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return ((await response.json()) as { user: User }).user;
  } catch {
    return null;
  }
}
