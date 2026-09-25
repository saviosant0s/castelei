/*
| O lado da página do "usar sem internet". O trabalho pesado é do service
| worker (public/sw.js); aqui ficam as mensagens para ele.
*/

/** O mesmo nome que o sw.js usa. Mudou lá, muda aqui. */
export const CACHE_PAGINAS = "castelei-paginas-v1";

/**
 * Apaga as páginas guardadas no aparelho.
 *
 * Elas têm dados da conta — o progresso aparece nelas. Ao sair, ao entrar em
 * outra conta ou ao excluir a conta, o próximo a usar o aparelho não pode abrir
 * o que o anterior estudou. Falha em silêncio: sem service worker (em
 * desenvolvimento, ou navegador antigo) não há nada guardado.
 */
export async function limparPaginasGuardadas(): Promise<void> {
  try {
    if (typeof caches !== "undefined") await caches.delete(CACHE_PAGINAS);
  } catch {
    // nada guardado, nada a apagar
  }
}

/** O service worker que controla esta página, se houver. */
export function trabalhador(): ServiceWorker | null {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.controller;
}

/** As páginas de uma matéria que valem guardar: ela, o vocabulário e cada lição. */
export function paginasDaMateria(slug: string, lessonIds: number[], comVocabulario: boolean, area?: string): string[] {
  // A área entra junto: sem ela, o "voltar" da matéria abriria a tela de sem internet.
  const base = area ? [`/area/${area}`, `/materia/${slug}`] : [`/materia/${slug}`];
  if (comVocabulario) base.push(`/materia/${slug}/vocabulario`);
  return [...base, ...lessonIds.map((id) => `/licao/${id}`)];
}
