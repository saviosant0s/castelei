"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, messageOf, postJson } from "@/lib/client";

type Mode = "login" | "register";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const isRegister = mode === "register";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFormError(null);
    setFieldErrors({});

    const data = Object.fromEntries(new FormData(event.currentTarget));

    try {
      await postJson(`/api/auth/${mode}`, data);
      router.replace("/inicio");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.errors).length > 0) {
        setFieldErrors(error.errors);
      } else {
        setFormError(messageOf(error));
      }
      setBusy(false);
    }
  }

  const errorFor = (name: string) => fieldErrors[name]?.[0];

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {formError && (
        <p role="alert" className="rounded-2xl bg-brick-soft px-4 py-3 text-base text-brick">
          {formError}
        </p>
      )}

      {isRegister && (
        <div>
          <label htmlFor="name" className="mb-1.5 block font-bold">
            Nome
          </label>
          <input id="name" name="name" type="text" autoComplete="name" required className="field" aria-invalid={!!errorFor("name")} />
          {errorFor("name") && <p className="mt-1.5 text-sm text-brick">{errorFor("name")}</p>}
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-1.5 block font-bold">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          required
          className="field"
          aria-invalid={!!errorFor("email")}
        />
        {errorFor("email") && <p className="mt-1.5 text-sm text-brick">{errorFor("email")}</p>}
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block font-bold">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          minLength={isRegister ? 8 : undefined}
          required
          className="field"
          aria-invalid={!!errorFor("password")}
          aria-describedby={isRegister ? "password-hint" : undefined}
        />
        {isRegister && !errorFor("password") && (
          <p id="password-hint" className="mt-1.5 text-sm text-ink/60">
            Pelo menos 8 caracteres.
          </p>
        )}
        {errorFor("password") && <p className="mt-1.5 text-sm text-brick">{errorFor("password")}</p>}
      </div>

      <button type="submit" disabled={busy} className="btn btn-primary w-full">
        {busy ? "Um instante…" : isRegister ? "Criar conta grátis" : "Entrar"}
      </button>

      <p className="text-center text-base text-ink/70">
        {isRegister ? (
          <>
            Já tem conta?{" "}
            <Link href="/entrar" className="font-bold text-ink underline underline-offset-4">
              Entrar
            </Link>
          </>
        ) : (
          <>
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="font-bold text-ink underline underline-offset-4">
              Criar conta
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
