/**
 * Barra de progresso. Sempre acompanhada do número em texto: barra sozinha
 * obriga a medir a olho, e quem enxerga pouco fica sem a informação.
 */
type BarTone = "sage" | "sky" | "coral" | "ink";

const tones: Record<BarTone, string> = {
  sage: "bg-sage",
  sky: "bg-sky",
  coral: "bg-coral",
  ink: "bg-ink",
};

interface ProgressBarProps {
  /** de 0 a 100 */
  percent: number;
  tone?: BarTone;
  /** O que a barra mede, para quem usa leitor de tela. */
  label: string;
  /** `md` quando a barra é a notícia da tela; `sm` dentro de uma lista. */
  size?: "sm" | "md";
  /** Anima o preenchimento na entrada. Use só quando a barra é a notícia. */
  animate?: boolean;
  className?: string;
}

export function ProgressBar({
  percent,
  tone = "sage",
  label,
  size = "md",
  animate = false,
  className = "",
}: ProgressBarProps) {
  const safe = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <div
      className={`${size === "sm" ? "h-2" : "h-3"} overflow-hidden rounded-pill bg-ink/10 ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safe}
      aria-label={label}
    >
      <div className={`h-full rounded-pill ${tones[tone]} ${animate ? "anim-fill" : ""}`} style={{ width: `${safe}%` }} />
    </div>
  );
}
