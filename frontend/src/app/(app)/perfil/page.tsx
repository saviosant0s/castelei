import type { Metadata } from "next";
import Link from "next/link";
import { Crown } from "lucide-react";
import { InstallButton } from "@/components/InstallButton";
import { LogoutButton } from "@/components/LogoutButton";
import { serverGet } from "@/lib/backend";
import type { User } from "@/lib/types";

export const metadata: Metadata = { title: "Perfil" };

export default async function Perfil() {
  const { user } = await serverGet<{ user: User }>("/me");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl">{user.name}</h1>
        <p className="mt-1 text-base text-ink/70">{user.email}</p>
      </header>

      <Link href="/planos" className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-lift">
        <Crown className="size-6 shrink-0 text-sky" aria-hidden="true" />
        <span className="flex-1">
          <span className="block text-sm text-ink/60">Seu plano</span>
          <span className="block font-display text-2xl font-bold">{user.plan_label}</span>
        </span>
        <span className="text-base font-bold underline underline-offset-4">Ver planos</span>
      </Link>

      <section aria-labelledby="instalar" className="space-y-3">
        <h2 id="instalar" className="text-2xl">Use como aplicativo</h2>
        <InstallButton />
      </section>

      <LogoutButton />
    </div>
  );
}
