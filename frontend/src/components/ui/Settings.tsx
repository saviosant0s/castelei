import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Lista de ajustes: grupos com título curto, e dentro deles linhas separadas
 * por um traço fino.
 *
 * Existe porque o Perfil era uma pilha de seis seções, cada uma com um título
 * do tamanho de um título de página, um controle e uma frase solta embaixo.
 * Seis títulos grandes de igual peso não dizem o que é importante, e a tela
 * rolava para mostrar o que cabia em meia. Um grupo por ASSUNTO, e uma linha
 * por AJUSTE, é o desenho que a pessoa já conhece dos ajustes do celular: ela
 * acha o que procura sem ler a tela inteira.
 */
export function SettingsGroup({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="label-mono px-1">
        {title}
      </h2>
      <div className="mt-2 divide-y divide-ink/10 overflow-hidden rounded-card bg-surface-raised shadow-lift">
        {children}
      </div>
    </section>
  );
}

export type SettingsIconTone = "sky" | "coral" | "sage" | "neutral" | "danger";

const iconTones: Record<SettingsIconTone, string> = {
  sky: "bg-sky-soft text-sky",
  coral: "bg-coral-soft text-coral",
  sage: "bg-sage-soft text-sage",
  neutral: "bg-surface-sunken text-content-secondary",
  danger: "bg-brick-soft text-brick",
};

interface SettingsRowProps {
  icon: LucideIcon;
  iconTone?: SettingsIconTone;
  title: string;
  /** Uma frase: o que o ajuste faz, ou o estado dele agora. */
  description?: ReactNode;
  /** O controle à direita: um interruptor, um botão pequeno. */
  trailing?: ReactNode;
  /** O que ocupa a largura toda, embaixo do título (seletor de três opções). */
  below?: ReactNode;
  /** A linha inteira vira link, com a seta no fim. */
  href?: string;
  /** A linha inteira vira botão (sair da conta, excluir). */
  onClick?: () => void;
  disabled?: boolean;
  /** Linha de ação perigosa: o título vai em vermelho. */
  danger?: boolean;
}

export function SettingsRow({
  icon: Icon,
  iconTone = "neutral",
  title,
  description,
  trailing,
  below,
  href,
  onClick,
  disabled = false,
  danger = false,
}: SettingsRowProps) {
  const corpo = (
    <>
      {/* span, não div: a linha também vira botão, e botão só aceita conteúdo em linha. */}
      <span className="flex min-h-11 items-center gap-3.5">
        <span className={`grid size-10 shrink-0 place-items-center rounded-control ${iconTones[iconTone]}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block text-base font-bold ${danger ? "text-brick" : ""}`}>{title}</span>
          {description && <span className="mt-0.5 block text-sm text-content-subtle">{description}</span>}
        </span>
        {trailing}
        {href && <ChevronRight className="size-5 shrink-0 text-content-faint" aria-hidden="true" />}
      </span>
      {below && <div className="mt-3">{below}</div>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block px-4 py-3.5 transition hover:bg-surface-sunken/60">
        {corpo}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="block w-full px-4 py-3.5 text-left transition hover:bg-surface-sunken/60 disabled:opacity-60"
      >
        {corpo}
      </button>
    );
  }

  return <div className="px-4 py-3.5">{corpo}</div>;
}

/**
 * Interruptor de liga e desliga. É um `button` com `role="switch"`: o leitor
 * de tela anuncia "ligado" ou "desligado", e o nome vem de quem usa.
 */
export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (valor: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-8 w-13 shrink-0 items-center rounded-pill p-1 transition disabled:opacity-50 ${
        checked ? "bg-sage" : "bg-ink/20"
      }`}
    >
      <span
        aria-hidden="true"
        className={`block size-6 rounded-full bg-sheet shadow-lift transition-transform motion-reduce:transition-none ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
