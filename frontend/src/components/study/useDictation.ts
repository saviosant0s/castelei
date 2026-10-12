"use client";

import { useRef, useState, useSyncExternalStore } from "react";

/*
| Falar em vez de digitar.
|
| Quem transcreve é o próprio navegador (Web Speech API: Chrome no Android,
| Safari no iPhone). Para o app isso não custa nada — nenhum áudio passa pelo
| nosso servidor e nenhum serviço de transcrição é contratado. Navegador que
| não sabe fazer (o Firefox, por exemplo) não mostra o botão.
|
| Uma fala por toque, e não escuta contínua. O modo contínuo no Chrome do
| Android devolve a mesma frase repetida em pedaços — o texto saía dobrado. Uma
| fala por toque termina sozinha na pausa, e tocar de novo acrescenta mais.
*/

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type RecognitionCtor = new () => Recognition;

function ctor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noop = () => () => {};

export function useDictation(onText: (text: string) => void) {
  // Só se sabe no navegador; no servidor o botão não existe.
  const supported = useSyncExternalStore(noop, () => ctor() !== null, () => false);
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState("");
  const [error, setError] = useState<string | null>(null);
  const current = useRef<Recognition | null>(null);

  function toggle() {
    if (current.current) {
      current.current.stop();
      return;
    }
    const Ctor = ctor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "pt-BR";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let finalText = "";
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      setPartial(interim);
      if (finalText.trim()) onText(finalText.trim());
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError("O navegador não deixou usar o microfone. Libere a permissão do microfone para este site e tente de novo.");
      } else if (e.error !== "no-speech" && e.error !== "aborted") {
        setError("Não deu para ouvir agora. Tente de novo.");
      }
    };
    rec.onend = () => {
      current.current = null;
      setListening(false);
      setPartial("");
    };
    setError(null);
    current.current = rec;
    rec.start();
    setListening(true);
  }

  return { supported, listening, partial, error, toggle };
}

/** Junta o que foi falado ao que já estava escrito, com espaço e letra maiúscula onde precisa. */
export function appendSpoken(existing: string, spoken: string): string {
  const said = spoken.trim();
  if (!said) return existing;
  const before = existing.trimEnd();
  const startsSentence = before === "" || /[.!?]$/.test(before);
  const piece = startsSentence ? said.charAt(0).toUpperCase() + said.slice(1) : said;
  return before === "" ? piece : `${before} ${piece}`;
}
