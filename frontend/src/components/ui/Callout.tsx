import type { ComponentType, ReactNode } from "react";
import { Card, type CardTone } from "./Card";

/**
 * Aviso de uma linha com ícone: convite, explicação ou alerta.
 *
 * O papel decide o tom, não o gosto — `locked` é sempre tracejado, `alerta`
 * é sempre tijolo. Assim o aluno aprende a ler o formato sem depender da cor.
 */
export type CalloutRole = "info" | "convite" | "bloqueado" | "alerta" | "sucesso";

const roleTone: Record<CalloutRole, CardTone> = {
  info: "sky",
  convite: "sky",
  bloqueado: "dashed",
  alerta: "outline",
  sucesso: "sage",
};

const iconColor: Record<CalloutRole, string> = {
  info: "text-sky",
  convite: "text-sky",
  bloqueado: "text-ink/40",
  alerta: "text-brick",
  sucesso: "text-sage",
};

interface CalloutProps {
  children: ReactNode;
  role?: CalloutRole;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  href?: string;
}

export function Callout({ children, role = "info", icon: Icon, href }: CalloutProps) {
  return (
    <Card tone={roleTone[role]} href={href} className="flex items-center gap-4">
      {Icon && <Icon className={`size-6 shrink-0 ${iconColor[role]}`} aria-hidden={true} />}
      <span className="min-w-0 flex-1 text-base">{children}</span>
    </Card>
  );
}
