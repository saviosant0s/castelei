"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiError, messageOf, postJson } from "@/lib/client";

/**
 * Entrada do painel.
 *
 * É a mesma conta do app — não existe usuário separado de administrador. O que
 * muda é a permissão, que fica na conta. Por isso entrar aqui também troca a
 * sessão do app: é uma sessão só.
 */
export function AdminLoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErro(null);

    const data = Object.fromEntries(new FormData(event.currentTarget));

    try {
      await postJson("/api/auth/login", data);
      router.replace("/admin");
      router.refresh();
    } catch (error) {
      setErro(error instanceof ApiError && error.errors.email?.[0] ? error.errors.email[0] : messageOf(error));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {erro && (
        <p role="alert" className="rounded-control bg-brick-soft px-4 py-3 text-base text-brick">
          {erro}
        </p>
      )}

      <label className="block space-y-1.5">
        <span className="text-sm text-content-subtle">E-mail</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-control bg-surface-sunken px-4 py-3 text-base outline-none focus:ring-2 focus:ring-sky"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm text-content-subtle">Senha</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-control bg-surface-sunken px-4 py-3 text-base outline-none focus:ring-2 focus:ring-sky"
        />
      </label>

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-control bg-surface-bold px-4 py-3 text-base font-bold text-on-bold shadow-lift transition disabled:opacity-60"
      >
        {busy ? "Entrando…" : "Entrar no painel"}
      </button>
    </form>
  );
}
