import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Cartão: a superfície básica do Castelei.
 *
 * Os tons existem para o app não virar uma fileira de caixas brancas iguais
 * — o plano trata "cards arredondados enfileirados" como cara de IA. Escolha
 * o tom pelo peso que o conteúdo tem na tela, não por variedade.
 */
export type CardTone = "raised" | "bold" | "sky" | "coral" | "sage" | "outline" | "dashed" | "sunken";

const tones: Record<CardTone, string> = {
  raised: "bg-surface-raised shadow-lift",
  bold: "bg-surface-bold text-paper shadow-lift",
  sky: "bg-sky-soft",
  coral: "bg-coral-soft",
  sage: "bg-sage-soft",
  sunken: "bg-surface-sunken",
  outline: "border-2 border-ink/15 bg-surface-raised",
  // Tracejado = algo que existe mas ainda não é seu (recurso de outro plano).
  dashed: "border-2 border-dashed border-ink/25",
};

const sizes = { sm: "p-4", md: "p-5", lg: "p-6" } as const;

const radii = { card: "rounded-card", panel: "rounded-panel" } as const;

interface CardProps {
  children: ReactNode;
  tone?: CardTone;
  size?: keyof typeof sizes;
  radius?: keyof typeof radii;
  /** Vira link e ganha o leve levantar ao passar o dedo. */
  href?: string;
  className?: string;
  "aria-labelledby"?: string;
}

export function Card({
  children,
  tone = "raised",
  size = "md",
  radius = "card",
  href,
  className = "",
  ...rest
}: CardProps) {
  const base = `${radii[radius]} ${sizes[size]} ${tones[tone]} ${className}`;

  if (href) {
    const hoverable = tone === "dashed" ? "hover:border-ink/50" : "hover:-translate-y-0.5";

    return (
      <Link href={href} className={`block transition ${hoverable} ${base}`} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <div className={base} {...rest}>
      {children}
    </div>
  );
}
