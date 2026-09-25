import type { VocabularyTerm } from "@/lib/types";

/*
| O baralho dos cartões de vocabulário.
|
| Entram as palavras de lições JÁ PRATICADAS — o cartão é para lembrar, e
| ninguém lembra do que nunca viu. Com menos de cinco vistas, entra a matéria
| inteira: melhor treinar o que vem pela frente do que um baralho de duas
| cartas. No máximo vinte por rodada: é o que cabe numa pausa, e rodada longa
| demais vira maratona que ninguém termina.
*/
export const POR_RODADA = 20;

export function baralho(terms: VocabularyTerm[], aleatorio: () => number): VocabularyTerm[] {
  const vistas = terms.filter((t) => t.seen);
  const base = vistas.length >= 5 ? vistas : terms;
  const copia = [...base];

  // Fisher–Yates: cada ordem tem a mesma chance.
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }

  return copia.slice(0, POR_RODADA);
}
