"use client";

import { useEffect } from "react";

/*
| Guarda onde a pessoa estava na tela e devolve quando ela volta.
|
| Queixa do Sávio: descer a trilha até a lição 20, abrir a lição e tocar no X
| levava de volta ao TOPO da matéria. O X é um link para o pai (não um
| `router.back()`, ver o BackButton), e todo link novo abre a página no topo.
|
| Então a tela guarda a rolagem ao sair, por aba (`sessionStorage`), e a
| devolve ao abrir de novo. O prazo de 30 minutos existe para quem volta
| amanhã: aí faz sentido começar do topo.
*/
const PRAZO_MS = 30 * 60 * 1000;
const chave = (id: string) => `castelei:rolagem:${id}`;

export function ScrollMemory({ id }: { id: string }) {
  useEffect(() => {
    try {
      const guardada = sessionStorage.getItem(chave(id));
      if (guardada) {
        const { y, em } = JSON.parse(guardada) as { y: number; em: number };
        if (Date.now() - em < PRAZO_MS && y > 0) {
          // Dois quadros: o Next leva a página nova ao topo depois de montar,
          // e rolar antes disso seria desfeito.
          requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, y)));
        }
      }
    } catch {
      // Sem sessionStorage (aba anônima com bloqueio): abre no topo, como antes.
    }

    // Guarda no TOQUE, não na saída: quando a tela é desmontada, o Next já
    // levou a janela ao topo para a página seguinte, e o que se leria é zero.
    // O toque (em captura, antes do link agir) vem antes de qualquer troca.
    const guardar = () => {
      try {
        sessionStorage.setItem(chave(id), JSON.stringify({ y: window.scrollY, em: Date.now() }));
      } catch {
        // idem
      }
    };
    document.addEventListener("click", guardar, true);
    window.addEventListener("pagehide", guardar);

    return () => {
      document.removeEventListener("click", guardar, true);
      window.removeEventListener("pagehide", guardar);
    };
  }, [id]);

  return null;
}
