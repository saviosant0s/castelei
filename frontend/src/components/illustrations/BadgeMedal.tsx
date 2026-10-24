import type { ReactNode } from "react";

/**
 * A medalha de cada conquista, desenhada aqui (antes eram ícones do Lucide
 * num círculo verde, todos iguais menos o desenho do meio).
 *
 * A família escolhe a cor, como o módulo na trilha: constância é coral,
 * acerto é verde, o resto é azul. Quem diz QUAL conquista é o emblema, e as
 * de número (3, 7, 30 dias; 500, 1.000 XP) levam o número escrito — senão
 * "três dias" e "um mês" seriam a mesma chama.
 *
 * Bloqueada, a medalha fica cinza e sem emblema, com um cadeado. É a mesma
 * peça apagada, e não outra peça, para a pessoa reconhecer o que vai ganhar.
 */
type Familia = "sky" | "sage" | "coral";

const COR: Record<Familia, { fita: string; disco: string }> = {
  sky: { fita: "fill-sky-soft", disco: "fill-sky" },
  sage: { fita: "fill-sage-soft", disco: "fill-sage" },
  coral: { fita: "fill-coral-soft", disco: "fill-coral" },
};

/** Desenho em volta de (32, 44), dentro do disco de raio 22. */
const linha = "stroke-on-accent fill-none";

function Numero({ texto }: { texto: string }) {
  return (
    <text
      x="32"
      y="60"
      textAnchor="middle"
      className="fill-on-accent font-mono"
      fontSize={texto.length > 2 ? 10 : 12}
      fontWeight="700"
    >
      {texto}
    </text>
  );
}

const chama = (
  <path d="M32 30 C 38 37, 40 41, 38 46 C 37 49, 34 51, 32 51 C 28 51, 25 48, 26 44 C 26.5 41, 29 40, 29 36 C 31 38, 32 39, 32 30 Z" className="fill-on-accent" />
);

const estrela = (
  <path
    d="M32 31 L 35.2 37.6 L 42.4 38.4 L 37 43.2 L 38.6 50.4 L 32 46.8 L 25.4 50.4 L 27 43.2 L 21.6 38.4 L 28.8 37.6 Z"
    className="fill-on-accent"
  />
);

function emblema(badgeKey: string): { familia: Familia; desenho: ReactNode } {
  switch (badgeKey) {
    case "primeira-licao":
      // Duas pegadas, uma à frente da outra.
      return {
        familia: "sky",
        desenho: (
          <>
            <ellipse cx="27" cy="48" rx="4" ry="6" className="fill-on-accent" />
            <ellipse cx="37" cy="39" rx="4" ry="6" className="fill-on-accent" />
          </>
        ),
      };
    case "gabarito-limpo":
      return { familia: "sage", desenho: <path d="M23 44 l 6 6 l 12 -13" className={linha} strokeWidth={4} /> };
    case "virou-o-jogo":
      // A seta que dá a volta: errou, voltou, acertou.
      return {
        familia: "sage",
        desenho: (
          <>
            <path d="M41 40 A 10 10 0 1 0 41 49" className={linha} strokeWidth={3.5} />
            <path d="M42 33 L 42 41 L 34 41" className={linha} strokeWidth={3.5} />
          </>
        ),
      };
    case "recorde-de-tempo":
      return { familia: "sky", desenho: <path d="M35 29 L 25 46 L 32 46 L 29 59 L 40 41 L 33 41 Z" className="fill-on-accent" /> };
    case "duas-materias":
      // Dois livros, um em pé e um inclinado.
      return {
        familia: "sky",
        desenho: (
          <>
            <rect x="23" y="32" width="8" height="22" rx="1.5" className="fill-on-accent" />
            <rect x="33" y="32" width="8" height="22" rx="1.5" className="fill-on-accent" transform="rotate(14 37 54)" />
          </>
        ),
      };
    default:
      if (badgeKey.startsWith("streak-")) {
        return {
          familia: "coral",
          desenho: (
            <g>
              <g transform="translate(32 37) scale(0.72) translate(-32 -40)">{chama}</g>
              <Numero texto={badgeKey.slice("streak-".length)} />
            </g>
          ),
        };
      }
      if (badgeKey.startsWith("xp-")) {
        const valor = Number(badgeKey.slice("xp-".length));
        return {
          familia: "coral",
          desenho: (
            <g>
              <g transform="translate(32 37) scale(0.72) translate(-32 -40)">{estrela}</g>
              <Numero texto={valor >= 1000 ? `${valor / 1000}k` : String(valor)} />
            </g>
          ),
        };
      }
      return { familia: "sky", desenho: estrela };
  }
}

export function BadgeMedal({
  badgeKey,
  earned = true,
  className = "h-16 w-auto",
}: {
  badgeKey: string;
  earned?: boolean;
  className?: string;
}) {
  const { familia, desenho } = emblema(badgeKey);
  const cor = COR[familia];

  return (
    <svg viewBox="0 0 64 72" className={className} aria-hidden="true" strokeLinecap="round" strokeLinejoin="round">
      {/* A fita: duas pontas que descem para trás do disco. */}
      <path
        d="M20 2 L 30 26 L 24 30 L 14 6 Z M44 2 L 34 26 L 40 30 L 50 6 Z"
        className={earned ? `${cor.fita} stroke-ink` : "fill-surface-sunken stroke-ink/30"}
        strokeWidth={2}
      />
      <circle cx="32" cy="44" r="23" className={earned ? `${cor.disco} stroke-ink` : "fill-surface-sunken stroke-ink/30"} strokeWidth={2.5} />
      <circle cx="32" cy="44" r="18" className={earned ? "fill-none stroke-on-accent/40" : "fill-none stroke-ink/15"} strokeWidth={1.5} strokeDasharray={earned ? undefined : "3 4"} />
      {earned ? (
        desenho
      ) : (
        <>
          <rect x="25" y="42" width="14" height="11" rx="2" className="fill-ink/30" />
          <path d="M28 42 v -3 a 4 4 0 0 1 8 0 v 3" className="fill-none stroke-ink/30" strokeWidth={2.5} />
        </>
      )}
    </svg>
  );
}
