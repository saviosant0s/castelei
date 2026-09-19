import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Entrar" };

export default function Page() {
  return (
    <main className="mx-auto min-h-dvh max-w-md px-6 pb-12 pt-6">
      <Link href="/" aria-label="Página inicial do Castelei"><Logo /></Link>
      <h1 className="mt-12 text-4xl">Bem-vindo de volta</h1>
      <p className="mt-3 text-base text-ink/70">Entre para continuar de onde parou.</p>
      <div className="mt-8">
        <AuthForm mode="login" />
      </div>
    </main>
  );
}
