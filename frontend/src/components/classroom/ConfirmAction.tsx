"use client";

import { useState } from "react";
import { ApiError } from "@/lib/client";

/**
 * Ação que não tem volta (sair da turma, tirar um aluno, apagar a turma).
 *
 * Um toque abre o aviso escrito; o segundo, deliberado, confirma. A mesma
 * regra de excluir a conta: cor sozinha não conta a história.
 */
export function ConfirmAction({
  label,
  warning,
  confirmLabel,
  run,
  compact = false,
}: {
  label: string;
  warning: string;
  confirmLabel: string;
  run: () => Promise<void>;
  compact?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!confirming) {
    return (
      <button
        type="button"
        className={compact ? "min-h-11 px-2 text-sm font-bold text-brick underline-offset-4 hover:underline" : "btn btn-ghost w-full border-2 border-ink/15 text-brick"}
        onClick={() => setConfirming(true)}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-brick-soft/40 px-4 py-4">
      <p className="text-base">{warning}</p>
      {error && (
        <p role="alert" className="mt-2 text-base font-bold text-brick">
          {error}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={busy}
          className="btn btn-ghost flex-1 border-2 border-ink/15"
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={busy}
          className="btn flex-1 bg-brick text-on-bold hover:brightness-110"
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await run();
            } catch (e) {
              setError(e instanceof ApiError ? e.message : "Algo deu errado. Tente de novo.");
              setBusy(false);
            }
          }}
        >
          {busy ? "Um momento…" : confirmLabel}
        </button>
      </div>
    </div>
  );
}
