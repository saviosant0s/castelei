import type { ReactNode } from "react";
import { Moldura } from "./EmptyArt";

/**
 * O enfeite de cada matéria: um desenho pequeno do próprio assunto, no topo
 * da tela da matéria e da área.
 *
 * Pedido do Sávio, e com uma recusa antes: padrão geométrico de fundo
 * (Bauhaus, linhas, vidro, discos) ficou com "cara de Excel". O que ficou em
 * aberto era decorar cada matéria com DETALHES DO ASSUNTO, discretos. Por
 * isso é um desenho só, do tamanho de um ícone grande, e não uma estampa
 * atrás do texto: o frasco da Química, o globo da Geografia, o "¡Hola!" do
 * Espanhol.
 *
 * Mesma mão das telas vazias (`EmptyArt`): traço 2,5 de ponta redonda,
 * preenchimento na versão `-soft` da cor e um detalhe só na cor cheia. As
 * cores são classes do tema, então o desenho inverte no modo escuro.
 *
 * A matéria sem desenho próprio usa o da área; a área sem desenho não mostra
 * nada. Enfeite que falta não é erro.
 */

const traco = "stroke-ink fill-none";
const linhaFraca = "stroke-ink/25";

const desenhos: Record<string, () => ReactNode> = {
  /* Uma folha de caderno com um "a" e o til em destaque. */
  portugues: () => (
    <>
      <rect x="44" y="18" width="72" height="86" rx="8" className="fill-surface-raised stroke-ink" />
      <path d="M56 36 h 48 M56 92 h 48" className={linhaFraca} />
      <text x="80" y="84" textAnchor="middle" className="fill-ink font-display" fontSize="50" fontWeight="700">
        a
      </text>
      <path d="M67 48 c 4 -6, 8 -6, 13 -1 s 9 5, 13 -1" className="stroke-coral fill-none" strokeWidth={4} />
    </>
  ),

  /* A folha escrita e o lápis terminando a última linha. */
  "producao-textual": () => (
    <>
      <rect x="30" y="20" width="76" height="84" rx="8" className="fill-surface-raised stroke-ink" />
      <path d="M42 38 h 52 M42 50 h 46 M42 62 h 52 M42 74 h 30" className={linhaFraca} />
      <path d="M42 88 c 4 -6, 8 6, 12 0 s 8 6, 12 0 s 8 6, 10 0" className="stroke-sky fill-none" />
      <path d="M78 96 L 118 44 L 130 53 L 90 105 L 76 108 Z" className="fill-gold-soft stroke-ink" />
      <path d="M113 51 l 12 9" className={traco} />
    </>
  ),

  /* O esquadro e o x ao quadrado. */
  matematica: () => (
    <>
      <path d="M30 100 V 30 L 100 100 Z" className="fill-sky-soft stroke-ink" />
      <path d="M42 88 V 60 L 70 88 Z" className="fill-surface-raised stroke-ink" />
      <path d="M30 90 h 10 v 10" className="stroke-coral fill-none" />
      <text x="114" y="70" textAnchor="middle" className="fill-ink font-display" fontSize="34" fontWeight="700">
        x
      </text>
      <text x="132" y="50" textAnchor="middle" className="fill-coral font-display" fontSize="20" fontWeight="700">
        2
      </text>
    </>
  ),

  /* A régua, a moeda e a etiqueta de desconto: a conta da vida real. */
  "matematica-do-dia-a-dia": () => (
    <>
      <rect x="24" y="82" width="112" height="18" rx="3" className="fill-sage-soft stroke-ink" />
      <path d="M36 82 v 8 M48 82 v 5 M60 82 v 8 M72 82 v 5 M84 82 v 8 M96 82 v 5 M108 82 v 8 M120 82 v 5" className="stroke-ink" strokeWidth={2} />
      <circle cx="56" cy="50" r="20" className="fill-gold-soft stroke-ink" />
      <circle cx="56" cy="50" r="14" className="fill-none stroke-ink/30" />
      <text x="56" y="56" textAnchor="middle" className="fill-ink font-display" fontSize="15" fontWeight="700">
        R$
      </text>
      <path d="M92 32 H 120 L 132 47 L 120 62 H 92 Z" className="fill-coral-soft stroke-ink" />
      <text x="108" y="54" textAnchor="middle" className="fill-ink font-display" fontSize="18" fontWeight="700">
        %
      </text>
    </>
  ),

  /* Os dois valores de uma proposição: verdadeiro e falso. */
  logica: () => (
    <>
      <g transform="rotate(-8 56 62)">
        <rect x="34" y="34" width="44" height="58" rx="8" className="fill-sage-soft stroke-ink" />
        <text x="56" y="74" textAnchor="middle" className="fill-ink font-display" fontSize="30" fontWeight="700">
          V
        </text>
      </g>
      <g transform="rotate(8 104 62)">
        <rect x="82" y="34" width="44" height="58" rx="8" className="fill-coral-soft stroke-ink" />
        <text x="104" y="74" textAnchor="middle" className="fill-ink font-display" fontSize="30" fontWeight="700">
          F
        </text>
      </g>
      <path d="M80 14 v 10 M75 19 h 10" className="stroke-sky" />
    </>
  ),

  /* O pêndulo no meio do balanço, com o rastro do lado de onde veio. */
  fisica: () => (
    <>
      <path d="M44 18 h 72" className="stroke-ink" strokeWidth={4} />
      <path d="M58 82 Q 80 98 102 82" className="stroke-ink/30 fill-none" strokeDasharray="2 6" />
      <line x1="80" y1="18" x2="58" y2="70" className="stroke-ink/25" strokeDasharray="3 5" />
      <circle cx="54" cy="80" r="11" className="fill-none stroke-ink/30" strokeDasharray="3 4" />
      <line x1="80" y1="18" x2="102" y2="70" className={traco} />
      <circle cx="106" cy="80" r="12" className="fill-sky stroke-ink" />
      <path d="M124 72 q 4 8 0 16" className="stroke-ink/40 fill-none" />
    </>
  ),

  /* O frasco com o líquido e as bolhas subindo. */
  quimica: () => (
    <>
      <path d="M59.6 72 L 46 96 a 6 6 0 0 0 5 8 h 58 a 6 6 0 0 0 5 -8 L 100.4 72 Z" className="fill-sage-soft" />
      <path d="M72 24 v 26 L 46 96 a 6 6 0 0 0 5 8 h 58 a 6 6 0 0 0 5 -8 L 88 50 v -26" className={traco} />
      <path d="M66 22 h 28" className="stroke-ink" strokeWidth={4} />
      <path d="M59.6 72 H 100.4" className="stroke-ink/40" />
      <circle cx="70" cy="90" r="4" className="fill-surface-raised stroke-ink" strokeWidth={2} />
      <circle cx="88" cy="82" r="3" className="fill-surface-raised stroke-ink" strokeWidth={2} />
      <circle cx="100" cy="16" r="4" className="fill-sage stroke-ink" strokeWidth={2} />
      <circle cx="110" cy="6" r="3" className="fill-none stroke-ink/40" strokeWidth={2} />
    </>
  ),

  /* A folha com a nervura e uma célula pequena ao lado. */
  biologia: () => (
    <>
      <path d="M46 98 C 40 62, 70 32, 118 26 C 114 70, 86 96, 46 98 Z" className="fill-sage-soft stroke-ink" />
      <path d="M46 98 C 70 80, 94 56, 118 26" className={traco} />
      <path d="M66 82 l -2 -14 M80 70 l -1 -16 M94 56 l 0 -14 M74 78 l 14 2 M88 64 l 14 2" className="stroke-ink/40" />
      <circle cx="42" cy="38" r="15" className="fill-sky-soft stroke-ink" />
      <circle cx="46" cy="36" r="5" className="fill-sky stroke-ink" strokeWidth={2} />
    </>
  ),

  /* A coluna antiga e o pergaminho encostado nela. */
  historia: () => (
    <>
      <rect x="42" y="92" width="64" height="10" rx="2" className="fill-surface-raised stroke-ink" />
      <rect x="52" y="34" width="44" height="58" className="fill-surface-raised stroke-ink" />
      <path d="M63 40 v 46 M74 40 v 46 M85 40 v 46" className="stroke-ink/30" />
      <path d="M44 24 h 60 v 10 h -60 Z" className="fill-gold-soft stroke-ink" />
      <path d="M44 29 a 5 5 0 1 1 0 0.1 M104 29 a 5 5 0 1 0 0 0.1" className={traco} />
      <g transform="rotate(10 124 80)">
        <rect x="112" y="60" width="24" height="40" rx="3" className="fill-coral-soft stroke-ink" />
        <path d="M110 60 h 28 M110 100 h 28" className="stroke-ink" strokeWidth={4} />
        <path d="M118 72 h 12 M118 80 h 10 M118 88 h 12" className="stroke-ink/30" />
      </g>
    </>
  ),

  /* O globo no suporte, com um alfinete marcando um lugar. */
  geografia: () => (
    <>
      <path d="M44 62 a 36 36 0 0 0 64 22" className={traco} />
      <path d="M76 98 v 6 M62 104 h 28" className="stroke-ink" strokeWidth={3} />
      <circle cx="76" cy="58" r="30" className="fill-sky-soft stroke-ink" />
      <path d="M58 44 c 8 -4, 14 2, 12 8 s -10 6, -6 12 s -4 8, -10 2 Z" className="fill-sage-soft stroke-ink" strokeWidth={2} />
      <path d="M84 66 c 6 -2, 12 2, 10 8 s -8 8, -12 4 Z" className="fill-sage-soft stroke-ink" strokeWidth={2} />
      <ellipse cx="76" cy="58" rx="12" ry="30" className="fill-none stroke-ink/25" />
      <path d="M46 58 h 60" className="stroke-ink/25" />
      <path d="M112 44 c -8 -10, -8 -22, 0 -24 c 8 2, 8 14, 0 24 Z" className="fill-coral stroke-ink" strokeWidth={2} />
      <circle cx="112" cy="28" r="3" className="fill-surface-raised" />
    </>
  ),

  /* O balão de pensamento com a pergunta. */
  filosofia: () => (
    <>
      <rect x="44" y="18" width="84" height="58" rx="29" className="fill-surface-raised stroke-ink" />
      <text x="86" y="60" textAnchor="middle" className="fill-ink font-display" fontSize="38" fontWeight="700">
        ?
      </text>
      <circle cx="46" cy="86" r="7" className="fill-sky-soft stroke-ink" />
      <circle cx="34" cy="100" r="4" className="fill-sky-soft stroke-ink" strokeWidth={2} />
      <path d="M128 14 l 3 7 l 7 3 l -7 3 l -3 7 l -3 -7 l -7 -3 l 7 -3 Z" className="fill-coral stroke-ink" strokeWidth={2} />
    </>
  ),

  /* Três pessoas lado a lado: a sociedade é gente junta. */
  sociologia: () => (
    <>
      <path d="M28 104 a 22 22 0 0 1 44 0 Z" className="fill-sky-soft stroke-ink" />
      <circle cx="50" cy="66" r="11" className="fill-sky-soft stroke-ink" />
      <path d="M88 104 a 22 22 0 0 1 44 0 Z" className="fill-sage-soft stroke-ink" />
      <circle cx="110" cy="66" r="11" className="fill-sage-soft stroke-ink" />
      <path d="M54 104 a 26 26 0 0 1 52 0 Z" className="fill-coral-soft stroke-ink" />
      <circle cx="80" cy="56" r="13" className="fill-coral-soft stroke-ink" />
    </>
  ),

  /* A mesma conversa em duas línguas: o "Olá" pequeno e o "Hi!" na frente. */
  ingles: () => (
    <>
      <path d="M92 20 h 40 a 10 10 0 0 1 10 10 v 16 a 10 10 0 0 1 -10 10 h -6 l 2 10 l -12 -10 h -24 a 10 10 0 0 1 -10 -10 v -16 a 10 10 0 0 1 10 -10 Z" className="fill-surface-raised stroke-ink/40" />
      <text x="114" y="44" textAnchor="middle" className="fill-ink/50 font-display" fontSize="14" fontWeight="700">
        Olá
      </text>
      <path d="M38 46 h 60 a 14 14 0 0 1 14 14 v 18 a 14 14 0 0 1 -14 14 h -40 l -14 12 l 2 -12 h -8 a 14 14 0 0 1 -14 -14 v -18 a 14 14 0 0 1 14 -14 Z" className="fill-sky-soft stroke-ink" />
      <text x="68" y="80" textAnchor="middle" className="fill-ink font-display" fontSize="28" fontWeight="700">
        Hi!
      </text>
    </>
  ),

  /* O mesmo par de balões, agora com o "¡Hola!" de ponto de exclamação invertido. */
  espanhol: () => (
    <>
      <path d="M92 20 h 40 a 10 10 0 0 1 10 10 v 16 a 10 10 0 0 1 -10 10 h -6 l 2 10 l -12 -10 h -24 a 10 10 0 0 1 -10 -10 v -16 a 10 10 0 0 1 10 -10 Z" className="fill-surface-raised stroke-ink/40" />
      <text x="114" y="44" textAnchor="middle" className="fill-ink/50 font-display" fontSize="14" fontWeight="700">
        Olá
      </text>
      <path d="M30 46 h 74 a 14 14 0 0 1 14 14 v 18 a 14 14 0 0 1 -14 14 h -50 l -14 12 l 2 -12 h -12 a 14 14 0 0 1 -14 -14 v -18 a 14 14 0 0 1 14 -14 Z" className="fill-gold-soft stroke-ink" />
      <text x="67" y="80" textAnchor="middle" className="fill-ink font-display" fontSize="24" fontWeight="700">
        ¡Hola!
      </text>
    </>
  ),

  /* A paleta com quatro tintas e o pincel. */
  artes: () => (
    <>
      <path d="M40 70 C 26 46, 56 22, 90 24 C 124 26, 134 58, 110 74 C 98 82, 104 96, 86 98 C 62 100, 50 88, 40 70 Z" className="fill-surface-raised stroke-ink" />
      <circle cx="94" cy="80" r="7" className="fill-surface stroke-ink" strokeWidth={2} />
      <circle cx="56" cy="58" r="7" className="fill-coral" />
      <circle cx="70" cy="40" r="7" className="fill-gold" />
      <circle cx="92" cy="38" r="7" className="fill-sky" />
      <circle cx="110" cy="54" r="7" className="fill-sage" />
      <path d="M116 104 L 142 66" className="stroke-ink" strokeWidth={5} />
      <path d="M140 69 l 6 -9 c 3 -4, 8 -2, 6 3 l -6 9 Z" className="fill-coral-soft stroke-ink" strokeWidth={2} />
    </>
  ),

  /* A bola e o apito. */
  "educacao-fisica": () => (
    <>
      <circle cx="62" cy="72" r="28" className="fill-gold-soft stroke-ink" />
      <path d="M36 62 C 54 58, 76 68, 88 84" className={traco} />
      <path d="M54 46 C 64 62, 64 82, 52 98" className={traco} />
      <path d="M84 56 C 72 62, 70 76, 78 96" className={traco} />
      <path d="M96 26 C 80 18, 70 32, 84 42" className="stroke-ink/40 fill-none" strokeDasharray="2 5" />
      <rect x="110" y="36" width="30" height="14" rx="3" className="fill-coral-soft stroke-ink" />
      <circle cx="110" cy="52" r="14" className="fill-coral-soft stroke-ink" />
      <circle cx="110" cy="52" r="4" className="fill-surface-raised stroke-ink" strokeWidth={2} />
    </>
  ),

  /* A tela com uma janela aberta e a seta do mouse. */
  informatica: () => (
    <>
      <rect x="30" y="20" width="100" height="66" rx="8" className="fill-surface-raised stroke-ink" />
      <rect x="40" y="30" width="80" height="46" rx="4" className="fill-sky-soft stroke-ink" strokeWidth={2} />
      <path d="M40 40 h 80" className="stroke-ink" strokeWidth={2} />
      <circle cx="47" cy="35" r="1.6" className="fill-coral" />
      <circle cx="53" cy="35" r="1.6" className="fill-gold" />
      <circle cx="59" cy="35" r="1.6" className="fill-sage" />
      <path d="M48 52 h 30 M48 62 h 22" className="stroke-ink/30" strokeWidth={2} />
      <path d="M70 86 h 20 l 4 14 h -28 Z" className="fill-surface-raised stroke-ink" />
      <path d="M90 50 V 74 L 96 68 L 101 78 L 105 76 L 100 66 L 108 66 Z" className="fill-coral stroke-ink" strokeWidth={2} />
    </>
  ),
};

/** Qual desenho vale para esta matéria: o dela, senão o da área, senão nenhum. */
export function subjectArtKey(subject: { slug: string; area?: string | null }): string | null {
  if (desenhos[subject.slug]) return subject.slug;
  if (subject.area && desenhos[subject.area]) return subject.area;
  return null;
}

/** O desenho de uma matéria ou de uma área. Sem desenho, não renderiza nada. */
export function SubjectArt({ name, className = "h-20 w-auto" }: { name: string | null; className?: string }) {
  const desenho = name ? desenhos[name] : undefined;
  if (!desenho) return null;
  return <Moldura className={className}>{desenho()}</Moldura>;
}
