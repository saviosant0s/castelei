import type { Metadata } from "next";
import Link from "next/link";
import { Crown, SlidersHorizontal } from "lucide-react";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";
import { InstallButton } from "@/components/InstallButton";
import { LogoutButton } from "@/components/LogoutButton";
import { SoundToggle } from "@/components/SoundToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
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

      {/* Só aparece para quem administra: o app não anuncia porta que a pessoa não pode abrir. */}
      {user.is_admin && (
        <Card href="/admin" tone="sunken" className="flex items-center gap-4">
          <SlidersHorizontal className="size-6 shrink-0 text-content-secondary" aria-hidden="true" />
          <span className="flex-1">
            <span className="block font-display text-xl font-bold">Painel de conteúdo</span>
            <span className="block text-sm text-content-subtle">Matérias, lições, questões e mídia</span>
          </span>
        </Card>
      )}

      <section aria-labelledby="tema" className="space-y-3">
        <h2 id="tema" className="text-2xl">Aparência</h2>
        <ThemeToggle />
        <p className="text-sm text-content-subtle">
          No automático, o app acompanha o tema do seu aparelho. A escolha vale neste aparelho.
        </p>
      </section>

      <section aria-labelledby="som" className="space-y-3">
        <h2 id="som" className="text-2xl">Som</h2>
        <SoundToggle />
        <p className="text-sm text-content-subtle">
          Um toque curto ao acertar e ao errar, no Modo Prova. Vale neste aparelho.
        </p>
      </section>

      <section aria-labelledby="instalar" className="space-y-3">
        <h2 id="instalar" className="text-2xl">Use como aplicativo</h2>
        <InstallButton />
      </section>

      <section aria-labelledby="conta" className="space-y-3">
        <h2 id="conta" className="text-2xl">Sua conta</h2>
        {!guest && <LogoutButton />}
        <DeleteAccountButton guest={guest} />
      </section>

      {/* A Play Store espera a política acessível também de dentro do app. */}
      <footer className="pt-2">
        <Link href="/privacidade" className="text-base text-content-subtle underline underline-offset-4">
          Política de Privacidade
        </Link>
      </footer>
    </div>
  );
}
