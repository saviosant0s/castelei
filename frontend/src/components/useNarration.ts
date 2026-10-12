"use client";

import { useEffect, useRef, useState } from "react";

/*
| O tocador da narração.
|
| Um elemento de áudio só, para a lição inteira. O iPhone só deixa tocar som
| dentro de um toque; o primeiro "Ouvir" libera ESTE elemento, e trocar o
| `src` dele depois — quando a etapa acaba e a lição avança sozinha — continua
| valendo. Um elemento novo por etapa ficaria mudo a partir da segunda.
|
| `listening` é a intenção ("estou ouvindo a lição"), não o estado do áudio.
| Ela atravessa as etapas: terminou uma, a próxima começa; a pessoa voltou
| uma etapa com o dedo, a voz acompanha. Etapa sem gravação para a voz, sem
| desligar a intenção à força — o botão simplesmente não aparece nela.
*/

/**
 * `onEnded` diz se a voz segue: `true` depois de avançar a etapa, `false`
 * para parar (a última etapa da lição).
 */
export function useNarration(src: string | null, onEnded: () => boolean) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [listening, setListening] = useState(false);
  const playing = listening && src !== null;

  // O fim de uma etapa chama sempre a versão mais nova de `onEnded`.
  const ended = useRef(onEnded);
  useEffect(() => {
    ended.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    if (!playing) {
      el.pause();
      return;
    }
    if (!el.src.endsWith(src!)) el.src = src!;
    el.play().catch(() => setListening(false));
  }, [playing, src]);

  // Saiu da lição: a voz não pode continuar falando na tela da matéria.
  useEffect(() => () => audio.current?.pause(), []);

  function toggle() {
    if (!audio.current) {
      const el = new Audio();
      el.preload = "auto";
      el.addEventListener("ended", () => {
        if (!ended.current()) setListening(false);
      });
      audio.current = el;
    }
    if (playing) {
      setListening(false);
      return;
    }
    // Dentro do toque, para o iPhone liberar o som (ver acima).
    // Mesma etapa: retoma de onde pausou, em vez de recomeçar a frase.
    if (src) {
      if (!audio.current.src.endsWith(src)) audio.current.src = src;
      audio.current.play().catch(() => setListening(false));
    }
    setListening(true);
  }

  return { playing, toggle };
}
