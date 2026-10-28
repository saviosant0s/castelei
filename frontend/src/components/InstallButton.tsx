"use client";

import { useSyncExternalStore } from "react";
import { Download, Smartphone } from "lucide-react";
import { SettingsRow } from "@/components/ui";
import { installPrompt, promptInstall, subscribeInstallPrompt } from "@/lib/install-prompt";

export function InstallButton() {
  // O convite foi guardado na abertura do app (lib/install-prompt.ts); aqui só se lê.
  const promptEvent = useSyncExternalStore(subscribeInstallPrompt, installPrompt, () => null);

  return (
    <SettingsRow
      icon={Smartphone}
      iconTone="sky"
      title="Instalar no aparelho"
      description={
        promptEvent
          ? "Abre como aplicativo, com ícone na tela de início."
          : "No iPhone: Compartilhar e depois \u201cAdicionar à Tela de Início\u201d. No Android e no computador, o botão aparece aqui quando o navegador permitir."
      }
      trailing={
        promptEvent && (
          <button
            type="button"
            className="btn btn-dark min-h-10 shrink-0 px-4 text-sm"
            onClick={() => void promptInstall()}
          >
            <Download className="size-4" aria-hidden="true" /> Instalar
          </button>
        )
      }
    />
  );
}
