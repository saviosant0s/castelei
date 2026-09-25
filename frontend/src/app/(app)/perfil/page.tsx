import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, CloudUpload, Crown, LogIn, Palette, ShieldCheck, SlidersHorizontal, Volume2 } from "lucide-react";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";
import { InstallButton } from "@/components/InstallButton";
import { LogoutButton } from "@/components/LogoutButton";
import { PushToggle } from "@/components/PushToggle";
import { SoundToggle } from "@/components/SoundToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SettingsGroup, SettingsRow } from "@/components/ui";
import { serverGet } from "@/lib/backend";
import { initials } from "@/lib/format";
import { isGuestMode } from "@/lib/proxy";
import type { User } from "@/lib/types";

export const metadata: Metadata = { title: "Perfil" };

/*
| O Perfil é uma tela de AJUSTES, e por isso tem a cara dos ajustes do
| celular: quem é você, o seu plano, e depois grupos com uma linha por ajuste.
| Antes eram seis seções de título grande, cada uma com um controle e uma
| frase solta — tudo com o mesmo peso, e nada se achava sem ler a tela toda.
|
| A ordem é a da frequência de uso: aparência e som primeiro, conta por
| último. Excluir a conta mora no fim do último grupo, longe do polegar
| distraído, e ainda pede confirmação.
*/
export default async function Perfil({ searchParams }: { searchParams: Promise<{ conta?: string }> }) {
  const { user } = await serverGet<{ user: User }>("/me");
  // Visitante é a CONTA, não o modo do servidor: quem criou conta com o modo de teste ligado já não é visitante.
  const guest = user.is_guest ?? isGuestMode();
  const contaCriada = (await searchParams).conta === "criada";

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="grid size-16 shrink-0 place-items-center rounded-full bg-sky font-display text-2xl font-bold text-on-accent"
        >
          {initials(user.name)}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-3xl">{user.name}</h1>
          <p className="mt-0.5 truncate text-base text-content-secondary">
            {guest ? "Sem conta por enquanto" : user.email}
          </p>
        </div>
      </header>

      <div className="space-y-3">
        <Link
          href="/planos"
          className="flex items-center gap-4 rounded-card bg-surface-bold p-5 text-on-bold shadow-lift transition hover:-translate-y-0.5"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-control bg-sky text-on-accent">
            <Crown className="size-6" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm on-bold-secondary">Seu plano</span>
            <span className="block font-display text-2xl font-bold">{user.plan_label}</span>
            {user.unlocked_for_testing && (
              <span className="block text-sm on-bold-secondary">Tudo liberado durante os testes</span>
            )}
          </span>
          <ChevronRight className="size-5 shrink-0 on-bold-secondary" aria-hidden="true" />
        </Link>

        {contaCriada && !guest && (
          <p role="status" className="rounded-2xl bg-sage-soft px-4 py-3 text-base">
            <strong>Conta criada.</strong> Seu histórico está guardado. Em outro aparelho, é só entrar com {user.email}.
          </p>
        )}
      </div>

      {/*
        O convite para criar conta mora no TOPO do Perfil, antes dos ajustes.
        Sem conta, limpar os dados do navegador (ou trocar de celular) apaga
        tudo que a pessoa estudou — e ela só descobre depois.
      */}
      {guest && (
        <SettingsGroup id="conta-visitante" title="Guarde o seu histórico">
          <SettingsRow
            icon={CloudUpload}
            iconTone="sage"
            title="Criar minha conta"
            description="Leva tudo que você já estudou aqui. Depois é só entrar em qualquer aparelho."
            href="/cadastro"
          />
          <SettingsRow icon={LogIn} iconTone="sky" title="Já tenho conta: entrar" href="/entrar" />
        </SettingsGroup>
      )}

      <SettingsGroup id="aparencia" title="Aparência e som">
        <SettingsRow
          icon={Palette}
          iconTone="sky"
          title="Tema"
          description="No automático, segue o tema do aparelho."
          below={<ThemeToggle />}
        />
        <SettingsRow
          icon={Volume2}
          iconTone="sage"
          title="Som nas respostas"
          description="Um toque curto ao acertar e ao errar."
          trailing={<SoundToggle />}
        />
      </SettingsGroup>

      <SettingsGroup id="estudo" title="Estudo">
        <PushToggle />
        <InstallButton />
      </SettingsGroup>

      <SettingsGroup id="conta" title="Conta">
        {/* Só aparece para quem administra: o app não anuncia porta que a pessoa não pode abrir. */}
        {user.is_admin && (
          <SettingsRow
            icon={SlidersHorizontal}
            title="Painel de conteúdo"
            description="Matérias, lições, questões e mídia"
            href="/admin"
          />
        )}
        {/* A Play Store espera a política acessível também de dentro do app. */}
        <SettingsRow icon={ShieldCheck} title="Política de Privacidade" href="/privacidade" />
        {!guest && <LogoutButton />}
        <DeleteAccountButton guest={guest} />
      </SettingsGroup>

      <p className="text-center text-sm text-content-faint">O tema e o som valem só neste aparelho.</p>
    </div>
  );
}
