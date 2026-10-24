import type { ReactNode } from "react";

/**
 * Ilustrações das telas vazias. Desenho nosso, sem banco de imagens.
 *
 * São SVG dentro do React, e não arquivos em `public/`, por um motivo: as
 * cores vêm das classes do tema (`fill-sky-soft`, `stroke-ink`), então o
 * desenho inverte junto com o modo escuro. Um `.svg` em `<img>` não enxerga
 * o CSS da página, e teria que morar numa folha branca como as figuras.
 *
 * O traço é um só em todas (2,5 com ponta redonda), preenchimento é sempre a
 * versão `-soft` da cor e só um detalhe leva a cor cheia. É o que faz as oito
 * parecerem da mesma mão.
 */
export type EmptyArtName =
  | "progresso"
  | "evolucao"
  | "conquistas"
  | "revisar"
  | "buscar"
  | "vocabulario"
  | "correcoes"
  | "em-breve";

const traco = "stroke-ink fill-none";

function Moldura({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 160 120"
      className="h-28 w-auto"
      aria-hidden="true"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* O chão: uma sombra achatada, que assenta o desenho na página. */}
      <ellipse cx="80" cy="108" rx="54" ry="6" className="fill-ink/[0.06]" />
      {children}
    </svg>
  );
}

const desenhos: Record<EmptyArtName, () => ReactNode> = {
  /* Um caminho subindo até uma bandeira: o primeiro passo ainda por dar. */
  progresso: () => (
    <>
      <path d="M30 96 C 52 96, 50 72, 74 70 S 100 50, 118 40" className="stroke-ink/30 fill-none" strokeDasharray="2 7" />
      <circle cx="30" cy="96" r="8" className="fill-sky stroke-ink" />
      <circle cx="74" cy="70" r="7" className="fill-surface-sunken stroke-ink" />
      <line x1="118" y1="40" x2="118" y2="96" className={traco} />
      <path d="M118 40 L 140 47 L 118 55 Z" className="fill-coral-soft stroke-ink" />
    </>
  ),

  /* Um gráfico com um ponto só: falta o segundo para haver linha. */
  evolucao: () => (
    <>
      <rect x="28" y="22" width="104" height="78" rx="10" className="fill-surface-raised stroke-ink" />
      <line x1="40" y1="86" x2="120" y2="86" className="stroke-ink/30" />
      <line x1="40" y1="64" x2="120" y2="64" className="stroke-ink/15" />
      <line x1="40" y1="42" x2="120" y2="42" className="stroke-ink/15" />
      <circle cx="58" cy="70" r="6" className="fill-sky stroke-ink" />
      <path d="M64 66 L 100 46" className="stroke-ink/40 fill-none" strokeDasharray="3 6" />
      <circle cx="104" cy="44" r="6" className="fill-none stroke-ink/40" strokeDasharray="3 4" />
    </>
  ),

  /* Uma medalha ainda sem cor, pendurada na fita. */
  conquistas: () => (
    <>
      <path d="M66 18 L 80 50 L 94 18" className="fill-sky-soft stroke-ink" />
      <path d="M58 18 L 72 18 L 84 46" className={traco} />
      <circle cx="80" cy="70" r="24" className="fill-surface-sunken stroke-ink" />
      <circle cx="80" cy="70" r="15" className="fill-none stroke-ink/30" strokeDasharray="3 5" />
      <path d="M118 30 v 10 M113 35 h 10" className="stroke-coral" />
      <path d="M40 52 v 8 M36 56 h 8" className="stroke-sage" />
    </>
  ),

  /* O calendário com o dia de hoje marcado: está em dia. */
  revisar: () => (
    <>
      <rect x="36" y="26" width="88" height="74" rx="10" className="fill-surface-raised stroke-ink" />
      <path d="M36 46 h 88" className={traco} />
      <path d="M36 36 a 10 10 0 0 1 10 -10 h 68 a 10 10 0 0 1 10 10 v 10 h -88 Z" className="fill-sky-soft stroke-ink" />
      <line x1="58" y1="18" x2="58" y2="32" className={traco} />
      <line x1="102" y1="18" x2="102" y2="32" className={traco} />
      <circle cx="80" cy="73" r="15" className="fill-sage-soft stroke-ink" />
      <path d="M73 73 l 5 5 l 10 -10" className="stroke-sage fill-none" strokeWidth={3} />
    </>
  ),

  /* A lupa sobre uma página em branco. */
  buscar: () => (
    <>
      <rect x="34" y="20" width="62" height="80" rx="8" className="fill-surface-raised stroke-ink" />
      <path d="M46 38 h 38 M46 50 h 30 M46 62 h 34" className="stroke-ink/25" />
      <circle cx="98" cy="66" r="20" className="fill-sky-soft stroke-ink" />
      <path d="M90 60 a 10 10 0 0 1 10 -4" className="stroke-surface-raised fill-none" strokeWidth={3} />
      <line x1="112" y1="80" x2="128" y2="96" className="stroke-ink" strokeWidth={6} />
    </>
  ),

  /* O livro aberto, com as páginas ainda sem palavra. */
  vocabulario: () => (
    <>
      <path d="M80 36 C 66 28, 46 28, 30 32 V 96 C 46 92, 66 92, 80 100 Z" className="fill-surface-raised stroke-ink" />
      <path d="M80 36 C 94 28, 114 28, 130 32 V 96 C 114 92, 94 92, 80 100 Z" className="fill-sky-soft stroke-ink" />
      <path d="M42 50 h 26 M42 62 h 22 M42 74 h 26" className="stroke-ink/25" />
      <text x="105" y="72" textAnchor="middle" className="fill-ink font-display" fontSize="24" fontWeight="700">
        Aa
      </text>
    </>
  ),

  /* Um bilhete, o lápis e o brilho de quem vai responder. */
  correcoes: () => (
    <>
      <rect x="30" y="28" width="76" height="70" rx="10" className="fill-surface-raised stroke-ink" transform="rotate(-6 68 63)" />
      <path d="M44 52 h 40 M46 64 h 34 M48 76 h 22" className="stroke-ink/25" transform="rotate(-6 68 63)" />
      <path d="M96 92 L 128 46 L 138 53 L 106 99 L 94 102 Z" className="fill-coral-soft stroke-ink" />
      <path d="M124 52 l 10 7" className={traco} />
      <path d="M120 18 l 3 8 l 8 3 l -8 3 l -3 8 l -3 -8 l -8 -3 l 8 -3 Z" className="fill-sky stroke-ink" strokeWidth={2} />
    </>
  ),

  /* A ampulheta: ainda não chegou, mas está a caminho. */
  "em-breve": () => (
    <>
      <path d="M58 20 h 44 M58 100 h 44" className="stroke-ink" strokeWidth={4} />
      <path d="M62 22 C 62 46, 80 52, 80 60 C 80 68, 62 74, 62 98 H 98 C 98 74, 80 68, 80 60 C 80 52, 98 46, 98 22 Z" className="fill-surface-raised stroke-ink" />
      <path d="M68 34 C 70 44, 80 50, 80 54 C 80 50, 90 44, 92 34 Z" className="fill-coral-soft" />
      <path d="M66 96 C 68 84, 78 80, 80 80 C 82 80, 92 84, 94 96 Z" className="fill-coral" />
      <line x1="80" y1="60" x2="80" y2="78" className="stroke-coral" strokeDasharray="1 5" />
    </>
  ),
};

export function EmptyArt({ name }: { name: EmptyArtName }) {
  return <Moldura>{desenhos[name]()}</Moldura>;
}
