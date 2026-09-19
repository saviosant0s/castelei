import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Criar conta" };

export default function Page() {
  return (
    <main className="mx-auto min-h-dvh max-w-md px-6 pb-12 pt-6">
      <Link href="/" aria-label="Página inicial do Castelei"><Logo /></Link>
      <h1 className="mt-12 text-4xl">Crie sua conta</h1>
      <p className="mt-3 text-base text-ink/70">Leva menos de um minuto e é grátis.</p>
      <div className="mt-8">
        <AuthForm mode="register" />
      </div>
    </main>
  );
}
