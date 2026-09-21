import type { Metadata } from "next";
import Link from "next/link";
import { Crown } from "lucide-react";
import { InstallButton } from "@/components/InstallButton";
import { LogoutButton } from "@/components/LogoutButton";
import { Card } from "@/components/ui";
import { serverGet } from "@/lib/backend";
import { isGuestMode } from "@/lib/proxy";
import type { User } from "@/lib/types";

export const metadata: Metadata = { title: "Perfil" };

export default async function Perfil() {
  const { user } = await serverGet<{ user: User }>("/me");
  const guest = isGuestMode();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl">{user.name}</h1>
        {guest ? (
          <p className="mt-2 text-base text-content-secondary">
            Modo de teste: sem login. Seu progresso fica salvo neste navegador.
          </p>
        ) : (
          <p className="mt-1 text-base text-content-secondary">{user.email}</p>
        )}
      </header>

      <Card href="/planos" className="flex items-center gap-4">
        <Crown className="size-6 shrink-0 text-sky" aria-hidden="true" />
        <span className="flex-1">
          <span className="block text-sm text-content-subtle">Seu plano</span>
          <span className="block font-display text-2xl font-bold">{user.plan_label}</span>
          {user.unlocked_for_testing && (
            <span className="mt-0.5 block text-sm text-content-subtle">Tudo liberado durante os testes</span>
          )}
        </span>
        <span className="text-base font-bold underline underline-offset-4">Ver planos</span>
      </Card>

      <section aria-labelledby="instalar" className="space-y-3">
        <h2 id="instalar" className="text-2xl">Use como aplicativo</h2>
        <InstallButton />
      </section>

      {!guest && <LogoutButton />}

      {/* A Play Store espera a política acessível também de dentro do app. */}
      <footer className="pt-2">
        <Link href="/privacidade" className="text-base text-content-subtle underline underline-offset-4">
          Política de Privacidade
        </Link>
      </footer>
    </div>
  );
}
