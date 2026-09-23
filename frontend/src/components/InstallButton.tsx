"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";
import { SettingsRow } from "@/components/ui";

type InstallPromptEvent = Event & { prompt: () => Promise<void> };

export function InstallButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

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
            onClick={async () => {
              await promptEvent.prompt();
              setPromptEvent(null);
            }}
          >
            <Download className="size-4" aria-hidden="true" /> Instalar
          </button>
        )
      }
    />
  );
}
