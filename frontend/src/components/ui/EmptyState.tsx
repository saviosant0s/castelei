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
  /** `h2` quando a tela já tem um `h1` acima (dentro de abas, por exemplo). */
  level?: "h1" | "h2";
}

export function EmptyState({ title, description, action, icon: Icon, level = "h1" }: EmptyStateProps) {
  const Heading = level;

  return (
    <div className="space-y-5 pt-6">
      {Icon && <Icon className="size-10 text-content-faint" aria-hidden={true} />}
      <Heading className={level === "h1" ? "text-4xl" : "text-2xl"}>{title}</Heading>
      <p className="text-base text-content-secondary">{description}</p>
      {action && (
        <Link href={action.href} className="btn btn-primary">
          {action.label}
        </Link>
      )}
    </div>
  );
}
