"use client";

import type { ReactNode, TextareaHTMLAttributes, InputHTMLAttributes, ButtonHTMLAttributes } from "react";

/*
| As peças de formulário do painel.
|
| Moram aqui, e não em components/ui, porque são de outro mundo: o design
| system é feito para o app no celular, com área de toque grande e uma
| pergunta por tela. O painel é ferramenta de teclado em tela grande, com
| formulário denso. Misturar os dois estragaria os dois.
|
| As cores, essas sim, são as mesmas: saem dos papéis do design system.
*/

const campo =
  "w-full rounded-control bg-surface-sunken px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-sky disabled:opacity-60";

interface CampoProps {
  label: string;
  hint?: ReactNode;
  error?: string;
}

export function TextField({ label, hint, error, ...props }: CampoProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-content-subtle">{label}</span>
      <input {...props} className={campo} aria-invalid={error ? true : undefined} />
      {hint && !error && <span className="block text-sm text-content-subtle">{hint}</span>}
      {error && <span className="block text-sm text-brick">{error}</span>}
    </label>
  );
}

export function TextArea({
  label,
  hint,
  error,
  mono = false,
  ...props
}: CampoProps & { mono?: boolean } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-content-subtle">{label}</span>
      <textarea
        {...props}
        className={`${campo} ${mono ? "font-mono text-sm leading-relaxed" : ""}`}
        aria-invalid={error ? true : undefined}
      />
      {hint && !error && <span className="block text-sm text-content-subtle">{hint}</span>}
      {error && <span className="block text-sm text-brick">{error}</span>}
    </label>
  );
}

type Peso = "principal" | "normal" | "perigo";

const pesos: Record<Peso, string> = {
  principal: "bg-surface-bold text-paper shadow-lift",
  normal: "bg-surface-sunken text-content",
  perigo: "bg-brick-soft text-brick",
};

export function Button({
  peso = "normal",
  children,
  ...props
}: { peso?: Peso } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`select-none rounded-control px-4 py-2.5 text-base font-bold transition disabled:opacity-60 ${pesos[peso]}`}
    >
      {children}
    </button>
  );
}

/** Aviso de resultado: o que acabou de acontecer, em uma linha. */
export function Aviso({ tipo, children }: { tipo: "erro" | "ok" | "atencao"; children: ReactNode }) {
  const tons = {
    erro: "bg-brick-soft text-brick",
    ok: "bg-sage-soft text-content",
    atencao: "bg-coral-soft text-content",
  } as const;

  return (
    <p role={tipo === "erro" ? "alert" : "status"} className={`rounded-control px-4 py-3 text-base ${tons[tipo]}`}>
      {children}
    </p>
  );
}
