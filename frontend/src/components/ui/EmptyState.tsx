import Link from "next/link";
import type { ComponentType } from "react";

/**
 * Tela vazia. Nunca mostra só "nada aqui": o plano trata estado vazio sem
 * orientação como anti-padrão, então sempre há uma ação para sair dele.
 */
interface EmptyStateProps {
  title: string;
  description: string;
  action?: { label: string; href: string };
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}

export function EmptyState({ title, description, action, icon: Icon }: EmptyStateProps) {
  return (
    <div className="space-y-5 pt-6">
      {Icon && <Icon className="size-10 text-content-faint" aria-hidden={true} />}
      <h1 className="text-4xl">{title}</h1>
      <p className="text-base text-content-secondary">{description}</p>
      {action && (
        <Link href={action.href} className="btn btn-primary">
          {action.label}
        </Link>
      )}
    </div>
  );
}
