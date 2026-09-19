"use client";

import { TriangleAlert } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-4 pt-16 text-center">
      <TriangleAlert className="mx-auto size-10 text-coral" aria-hidden="true" />
      <h1 className="text-2xl">Algo não carregou</h1>
      <p role="alert" className="text-base text-ink/70">{error.message || "Tente de novo em instantes."}</p>
      <button type="button" className="btn btn-primary" onClick={reset}>Tentar de novo</button>
    </div>
  );
}
