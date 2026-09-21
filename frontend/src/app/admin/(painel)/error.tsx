"use client";

import { Card } from "@/components/ui";

export default function ErroNoPainel({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-5 py-8">
      <h1 className="text-3xl">Não deu para carregar</h1>
      <Card tone="outline">
        <p className="text-base">{error.message}</p>
      </Card>
      <button
        type="button"
        onClick={reset}
        className="select-none rounded-control bg-surface-bold px-4 py-2.5 text-base font-bold text-on-bold shadow-lift"
      >
        Tentar de novo
      </button>
    </div>
  );
}
