"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { MessageCircleQuestion, Mic, Square } from "lucide-react";
import { messageOf, postJson } from "@/lib/client";
import { formatDateTime } from "@/lib/format";
import { appendSpoken, useDictation } from "./useDictation";

export interface Doubt {
  id: number;
  question: string;
  answer: string;
  created_at: string;
}

/*
| Tirar uma dúvida no fim da lição.
|
| Nasceu do uso do Sávio: no fim da lição ele quase nunca tinha o que
| explicar, tinha o que PERGUNTAR. A IA responde com a lição inteira junto,
| para falar a mesma língua dela — e avisa quando vai além do que a lição
| ensina.
|
| Cada resposta fica guardada (`lesson_doubts`): rever a de ontem não pode
| custar outra pergunta. A mais nova aparece em cima, logo abaixo da caixa.
*/
export function LessonDoubts({ lessonId, initial }: { lessonId: number; initial: Doubt[] }) {
  const [pergunta, setPergunta] = useState("");
  const [duvidas, setDuvidas] = useState<Doubt[]>(initial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [restantes, setRestantes] = useState<number | null>(null);
  const atual = useRef(pergunta);
  const ditado = useDictation((falado) => {
    const novo = appendSpoken(atual.current, falado);
    atual.current = novo;
    setPergunta(novo);
  });
  const resposta = useRef<HTMLLIElement>(null);

  async function perguntar() {
    setEnviando(true);
    setErro(null);
    try {
      const r = await postJson<{ doubt: Doubt; remaining: number }>(`/api/lessons/${lessonId}/doubts`, {
        question: atual.current,
      });
      setDuvidas((d) => [r.doubt, ...d]);
      setRestantes(r.remaining);
      setPergunta("");
      atual.current = "";
      // A resposta nasce embaixo da caixa: ela vem até a pessoa.
      window.setTimeout(() => resposta.current?.scrollIntoView?.({ behavior: "smooth", block: "center" }), 50);
    } catch (e) {
      setErro(messageOf(e));
    } finally {
      setEnviando(false);
    }
  }

  const curta = pergunta.trim().length < 5;

  return (
    <div>
      <p className="text-sm text-content-secondary">
        Ficou alguma dúvida? Pergunte com as suas palavras. A resposta parte do que esta lição ensina.
      </p>
      <label htmlFor={`duvida-${lessonId}`} className="sr-only">
        Sua dúvida sobre esta lição
      </label>
      <textarea
        id={`duvida-${lessonId}`}
        value={pergunta}
        onChange={(e) => {
          atual.current = e.target.value;
          setPergunta(e.target.value);
        }}
        maxLength={1000}
        placeholder="Ex.: qual a diferença entre pronto e bloqueado?"
        className="mt-3 block min-h-24 w-full resize-y rounded-control border-2 border-ink/15 bg-paper px-3 py-2.5 text-base leading-relaxed [field-sizing:content] focus:border-sky focus-visible:outline-none"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {ditado.supported && (
          <button
            type="button"
            onClick={ditado.toggle}
            aria-pressed={ditado.listening}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold transition ${ditado.listening ? "bg-coral text-on-accent" : "border-2 border-ink/15 hover:bg-ink/5"}`}
          >
            {ditado.listening ? (
              <>
                <Square className="size-4" aria-hidden="true" /> Ouvindo… toque para parar
              </>
            ) : (
              <>
                <Mic className="size-4" aria-hidden="true" /> Falar a pergunta
              </>
            )}
          </button>
        )}
        <button
          type="button"
          onClick={perguntar}
          disabled={enviando || curta || ditado.listening}
          className="btn btn-dark min-h-11 flex-1 px-4"
        >
          <MessageCircleQuestion className="size-5" aria-hidden="true" />
          {enviando ? "Pensando…" : "Perguntar"}
        </button>
      </div>
      {ditado.partial && <p className="mt-2 text-sm italic text-content-secondary">{ditado.partial}</p>}
      {ditado.error && (
        <p role="alert" className="mt-2 text-sm text-content-secondary">
          {ditado.error}
        </p>
      )}
      {erro && (
        <p role="alert" className="mt-2 text-sm text-content-secondary">
          {erro}
        </p>
      )}

      {duvidas.length > 0 && (
        <ol className="mt-5 space-y-4" aria-live="polite">
          {duvidas.map((d, i) => (
            <li key={d.id} ref={i === 0 ? resposta : undefined} className="scroll-mb-40 rounded-2xl bg-sky-soft px-4 py-3">
              <p className="text-sm text-content-subtle">{formatDateTime(d.created_at)}</p>
              <p className="mt-1 font-bold">{d.question}</p>
              <p className="mt-2 whitespace-pre-line text-base leading-relaxed">{d.answer}</p>
            </li>
          ))}
        </ol>
      )}
      {restantes !== null && (
        <p className="mt-3 text-center text-sm text-content-subtle">
          {restantes === 0
            ? "Essa foi a última pergunta de hoje."
            : `Ainda dá para perguntar ${restantes} ${restantes === 1 ? "vez" : "vezes"} hoje.`}
        </p>
      )}
      {duvidas.length > 0 && (
        <p className="mt-3 text-center text-sm">
          <Link href="/correcoes" className="font-bold text-content-secondary underline underline-offset-4">
            Ver todas as minhas dúvidas e correções
          </Link>
        </p>
      )}
    </div>
  );
}
