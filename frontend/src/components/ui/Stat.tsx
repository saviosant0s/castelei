import type { ComponentType, ReactNode } from "react";

/**
 * Número em destaque com o que ele significa: XP, acerto, tempo médio.
 *
 * O rótulo vem antes do número no DOM, então o leitor de tela anuncia
 * "Tempo médio por questão, 38 segundos" — e não um 38 solto.
 */
interface StatProps {
  label: string;
  value: ReactNode;
  /** Uma linha curta embaixo: recorde anterior, comparação, dica. */
  hint?: ReactNode;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  iconClassName?: string;
  /** `lg` para o número principal da tela; `md` para os de apoio. */
  size?: "md" | "lg";
}

export function Stat({ label, value, hint, icon: Icon, iconClassName = "text-coral", size = "md" }: StatProps) {
  const valueSize = size === "lg" ? "text-4xl" : "text-2xl";

  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon className={`mt-0.5 size-5 shrink-0 ${iconClassName}`} aria-hidden={true} />}
      <div className="min-w-0">
        <p className="text-sm text-content-subtle">{label}</p>
        <p className={`font-mono font-medium ${valueSize}`}>{value}</p>
        {hint && <div className="mt-1 text-base">{hint}</div>}
      </div>
    </div>
  );
}
