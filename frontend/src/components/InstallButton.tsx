"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

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

  if (!promptEvent) {
    return (
      <p className="text-sm text-ink/70">
        Para instalar no iPhone: toque em Compartilhar e depois em &quot;Adicionar à Tela de Início&quot;. No Android e no
        computador, o botão de instalar aparece aqui quando o navegador permitir.
      </p>
    );
  }

  return (
    <button
      type="button"
      className="btn btn-dark w-full"
      onClick={async () => {
        await promptEvent.prompt();
        setPromptEvent(null);
      }}
    >
      <Download className="size-5" aria-hidden="true" /> Instalar o Castelei no aparelho
    </button>
  );
}
