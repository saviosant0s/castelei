import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

/**
 * Selo curto e arredondado: streak, XP, plano, contagem.
 *
 * O número usa fonte monoespaçada de propósito — dígitos alinhados são mais
 * fáceis de comparar de relance e dão o ar técnico que o app quer.
 */
export type PillTone = "sky" | "coral" | "sage" | "neutral";

const tones: Record<PillTone, string> = {
  sky: "bg-sky-soft",
  coral: "bg-coral-soft",
  sage: "bg-sage-soft",
  neutral: "bg-surface-sunken",
};

const iconTones: Record<PillTone, string> = {
  sky: "text-sky",
  coral: "text-coral",
  sage: "text-sage",
  neutral: "text-ink/60",
};

interface PillProps {
  children: ReactNode;
  tone?: PillTone;
  /** Ícone do Lucide. Nunca emoji: emoji muda de cara em cada sistema. */
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  /** O texto some para quem usa leitor de tela e entra este rótulo no lugar. */
  label?: string;
  href?: string;
}

export function Pill({ children, tone = "neutral", icon: Icon, label, href }: PillProps) {
  const content = (
    <>
      {Icon && <Icon className={`size-4 ${iconTones[tone]}`} aria-hidden={true} />}
      {children}
    </>
  );

  const className = `inline-flex items-center gap-1.5 rounded-pill px-3.5 py-1.5 font-mono text-sm font-medium ${tones[tone]}`;

  if (href) {
    return (
      <Link href={href} className={`${className} transition hover:brightness-95`} aria-label={label}>
        {content}
      </Link>
    );
  }

  return (
    <span className={className} aria-label={label}>
      {content}
    </span>
  );
}
