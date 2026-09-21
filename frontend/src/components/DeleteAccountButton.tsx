"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui";
import { postJson } from "@/lib/client";

/**
 * Exclusão de conta. A Google Play exige esse caminho dentro do app, e a
 * Política de Privacidade promete o mesmo direito.
 *
 * Apagar não tem volta, então não basta um toque: o botão abre um aviso e a
 * confirmação é um segundo gesto, deliberado. Nada de cor sozinha contando a
 * história — o aviso está escrito.
 */
export function DeleteAccountButton({ guest }: { guest: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!confirming) {
    return (
      <button
        type="button"
        className="btn btn-ghost w-full border-2 border-ink/15 text-content-secondary"
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="size-5" aria-hidden="true" /> Excluir minha conta
      </button>
    );
  }

  return (
    <Card tone="outline" aria-labelledby="excluir-aviso">
      <p id="excluir-aviso" className="text-base font-bold">Excluir a conta apaga tudo.</p>
      <p className="mt-2 text-base text-content-secondary">
        Some o seu histórico de estudo, o acerto por tópico, o XP, os dias seguidos e as conquistas.
        {guest
          ? " Como você está no modo de teste, um novo visitante começa do zero neste aparelho."
          : " Você precisará criar uma conta nova para voltar a estudar."}{" "}
        Isso não tem volta.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-base font-bold text-brick">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-2">
        <button
          type="button"
          disabled={busy}
          className="btn w-full bg-brick text-paper hover:brightness-110"
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await postJson("/api/auth/delete");
              router.replace(guest ? "/inicio" : "/entrar");
              router.refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Não foi possível excluir a conta agora.");
              setBusy(false);
            }
          }}
        >
          {busy ? "Excluindo..." : "Sim, excluir tudo"}
        </button>
        <button
          type="button"
          disabled={busy}
          className="btn btn-ghost w-full"
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
        >
          Cancelar
        </button>
      </div>
    </Card>
  );
}
