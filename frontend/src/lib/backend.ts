import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { apiBase, TOKEN_COOKIE } from "@/lib/proxy";

/** GET autenticado na API, para Server Components. Manda para o login se a sessão caiu. */
export async function serverGet<T>(path: string): Promise<T> {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) redirect("/entrar");

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
