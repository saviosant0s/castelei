"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

function assinar(avisar: () => void) {
  window.addEventListener("online", avisar);
  window.addEventListener("offline", avisar);
  return () => {
    window.removeEventListener("online", avisar);
    window.removeEventListener("offline", avisar);
  };
}

/*
| Aviso de "sem internet" no topo do app.
|
| Sem ele, a pessoa via a última versão guardada da tela sem saber que era
| antiga — e tocava em "Praticar" esperando que funcionasse.
*/
export function OfflineBanner() {
  const online = useSyncExternalStore(assinar, () => navigator.onLine, () => true);
  if (online) return null;

  return (
    <p role="status" className="mb-4 flex items-center gap-2 rounded-card bg-coral-soft px-4 py-2.5 text-sm">
      <WifiOff className="size-4 shrink-0 text-coral" aria-hidden="true" />
      Sem internet: você está vendo o que ficou guardado. Responder questões volta quando a conexão voltar.
    </p>
  );
}
