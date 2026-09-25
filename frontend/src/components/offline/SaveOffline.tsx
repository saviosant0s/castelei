"use client";

import { useEffect, useState } from "react";
import { CloudDownload, CloudOff } from "lucide-react";
import { trabalhador } from "@/lib/offline";

/*
| "Guardar para ler sem internet": baixa a matéria inteira para o aparelho.
|
| Só aparece quando existe service worker controlando a página (no app
| instalado e no navegador, em produção). Sem ele o botão prometeria o que não
| cumpre. E o texto diz a verdade sobre o limite: ler funciona; responder
| questão precisa de conexão, porque o gabarito fica no servidor.
*/
type Estado = { fase: "parado" } | { fase: "guardando"; feitas: number; total: number } | { fase: "pronto"; falhas: number };

export function SaveOffline({ urls }: { urls: string[] }) {
  const [disponivel, setDisponivel] = useState(false);
  const [estado, setEstado] = useState<Estado>({ fase: "parado" });

  useEffect(() => {
    const sw = trabalhador();
    // Descoberto só depois de montar: no servidor não existe service worker.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisponivel(sw !== null);
    if (!sw) return;

    const ouvir = (e: MessageEvent) => {
      const m = e.data ?? {};
      if (m.type === "progresso") setEstado({ fase: "guardando", feitas: m.feitas, total: m.total });
      if (m.type === "guardado") setEstado({ fase: "pronto", falhas: m.falhas });
    };
    navigator.serviceWorker.addEventListener("message", ouvir);
    return () => navigator.serviceWorker.removeEventListener("message", ouvir);
  }, []);

  if (!disponivel) return null;

  function guardar() {
    const sw = trabalhador();
    if (!sw) return;
    setEstado({ fase: "guardando", feitas: 0, total: urls.length });
    sw.postMessage({ type: "guardar", urls });
  }

  return (
    <div className="rounded-card border-2 border-dashed border-ink/20 px-4 py-3">
      {estado.fase === "pronto" ? (
        <p className="flex items-start gap-2 text-base" role="status">
          <CloudOff className="mt-0.5 size-5 shrink-0 text-sage" aria-hidden="true" />
          <span>
            <strong>Pronto.</strong> As lições desta matéria abrem sem internet
            {estado.falhas > 0 ? ` (${estado.falhas} não deram certo; tente de novo com conexão)` : ""}. Responder questões
            ainda precisa de conexão.
          </span>
        </p>
      ) : (
        <button type="button" onClick={guardar} disabled={estado.fase === "guardando"} className="flex w-full items-center gap-3 text-left text-base">
          <CloudDownload className="size-5 shrink-0 text-sky" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <strong className="block">
              {estado.fase === "guardando" ? `Guardando ${estado.feitas} de ${estado.total}…` : "Guardar para ler sem internet"}
            </strong>
            <span className="block text-sm text-content-secondary">As lições ficam no aparelho. As questões ainda precisam de conexão.</span>
          </span>
        </button>
      )}
    </div>
  );
}
