"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, NotebookPen, Sparkles, Square } from "lucide-react";
import { getJson, messageOf, postJson, putJson } from "@/lib/client";
import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { NoteReview, type NoteReviewData } from "./NoteReview";
import { appendSpoken, useDictation } from "./useDictation";

/*
| O caderno da lição: o que a pessoa entendeu, com as palavras dela.
|
| Mora na última etapa, a de resumo, porque é ali que faz sentido escrever —
| depois de ler, antes de praticar. Guarda sozinho um segundo depois de a
| pessoa parar de digitar: botão "Salvar" é o tipo de coisa que se esquece de
| apertar, e a anotação some junto.
|
| Vai para a conta, não para o aparelho: é histórico de estudo, e aparece na
| busca.
*/
type Estado = "carregando" | "pronto" | "salvando" | "salvo" | "erro";

/** `bare`: dentro da caixa de abas do fim da lição, sem o cartão próprio. */
export function LessonNote({ lessonId, bare = false }: { lessonId: number; bare?: boolean }) {
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState<Estado>("carregando");
  const [erro, setErro] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  /** A correção por IA existe? Vem do backend: sem chave, o botão nem aparece. */
  const [ia, setIa] = useState(false);
  const [correcao, setCorrecao] = useState<{
    carregando: boolean;
    dados: NoteReviewData | null;
    /** Quando foi feita — a guardada de outro dia mostra a data. */
    quando: string | null;
    erro: string | null;
    restantes: number | null;
  }>({ carregando: false, dados: null, quando: null, erro: null, restantes: null });

  useEffect(() => {
    let vivo = true;
    getJson<{
      note: { text: string } | null;
      ai?: boolean;
      last_review?: { review: NoteReviewData; created_at: string } | null;
    }>(`/api/lessons/${lessonId}/note`)
      .then((data) => {
        if (!vivo) return;
        setTexto(data.note?.text ?? "");
        setIa(data.ai === true);
        // A última correção volta guardada: rever não gasta outra.
        if (data.last_review) {
          setCorrecao((c) => ({ ...c, dados: data.last_review!.review, quando: data.last_review!.created_at }));
        }
        setEstado("pronto");
      })
      .catch(() => vivo && setEstado("pronto"));
    return () => {
      vivo = false;
    };
  }, [lessonId]);

  // A fala chega depois do toque: junta ao texto de AGORA, não ao de quando tocou.
  const atual = useRef(texto);
  useEffect(() => {
    atual.current = texto;
  }, [texto]);
  const ditado = useDictation((falado) => escrever(appendSpoken(atual.current, falado)));

  async function corrigir() {
    setCorrecao((c) => ({ ...c, carregando: true, erro: null }));
    try {
      const r = await postJson<{ review: NoteReviewData; saved: { created_at: string }; remaining: number }>(
        `/api/lessons/${lessonId}/note/review`,
        { text: atual.current },
      );
      setCorrecao({ carregando: false, dados: r.review, quando: r.saved.created_at, erro: null, restantes: r.remaining });
    } catch (e) {
      setCorrecao((c) => ({ ...c, carregando: false, erro: messageOf(e) }));
    }
  }

  function escrever(valor: string) {
    atual.current = valor;
    setTexto(valor);
    setEstado("salvando");
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try {
        await putJson(`/api/lessons/${lessonId}/note`, { text: valor });
        setErro(null);
        setEstado("salvo");
      } catch (e) {
        setErro(messageOf(e));
        setEstado("erro");
      }
    }, 900);
  }

  return (
    <section
      aria-labelledby={`nota-${lessonId}`}
      className={bare ? "" : "mt-8 rounded-card bg-surface-raised px-5 py-4 shadow-lift"}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={`nota-${lessonId}`} className="flex items-center gap-2 text-base font-bold">
          <NotebookPen className="size-5 text-coral" aria-hidden="true" /> Minha anotação
        </h2>
        <span className="text-sm text-content-subtle" aria-live="polite">
          {estado === "salvando" ? "Salvando…" : estado === "salvo" ? "Salvo" : ""}
        </span>
      </div>
      <p className="mt-1 text-sm text-content-secondary">
        Escreva com as suas palavras o que você entendeu. Explicar para si mesmo é um dos jeitos que mais fixam.
      </p>
      <label htmlFor={`nota-texto-${lessonId}`} className="sr-only">
        Minha anotação sobre esta lição
      </label>
      <textarea
        id={`nota-texto-${lessonId}`}
        value={texto}
        disabled={estado === "carregando"}
        onChange={(e) => escrever(e.target.value)}
        maxLength={4000}
        placeholder={estado === "carregando" ? "Carregando…" : "Ex.: semáforo é um contador que deixa entrar enquanto for maior que zero."}
        className="mt-3 block min-h-28 w-full resize-y rounded-control border-2 border-ink/15 bg-paper px-3 py-2.5 text-base leading-relaxed [field-sizing:content] focus:border-sky focus-visible:outline-none"
      />
      {ditado.supported && (
        <div className="mt-3">
          <button
            type="button"
            onClick={ditado.toggle}
            disabled={estado === "carregando"}
            aria-pressed={ditado.listening}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold transition ${ditado.listening ? "bg-coral text-on-accent" : "border-2 border-ink/15 hover:bg-ink/5"}`}
          >
            {ditado.listening ? (
              <>
                <Square className="size-4" aria-hidden="true" /> Ouvindo… toque para parar
              </>
            ) : (
              <>
                <Mic className="size-4" aria-hidden="true" /> Falar em vez de digitar
              </>
            )}
          </button>
          {ditado.partial && (
            <p className="mt-2 text-sm italic text-content-secondary" aria-live="polite">
              {ditado.partial}
            </p>
          )}
          {ditado.error && (
            <p role="alert" className="mt-2 text-sm text-content-secondary">
              {ditado.error}
            </p>
          )}
        </div>
      )}
      {/*
      | Corrigir com IA: compara a explicação com a própria lição. O botão só
      | acende com uma ou duas frases escritas — abaixo disso não há o que
      | corrigir, e o pedido gastaria uma das correções do dia.
      */}
      {ia && (
        <div className="mt-4 border-t border-ink/10 pt-4">
          <button
            type="button"
            onClick={corrigir}
            disabled={correcao.carregando || texto.trim().length < 20 || ditado.listening}
            className="btn btn-dark w-full"
          >
            <Sparkles className="size-5" aria-hidden="true" />
            {correcao.carregando ? "Corrigindo…" : correcao.dados ? "Corrigir de novo" : "Corrigir minha explicação"}
          </button>
          {texto.trim().length < 20 && !correcao.dados && (
            <p className="mt-2 text-center text-sm text-content-subtle">
              Escreva ou fale uma ou duas frases para pedir a correção.
            </p>
          )}
          {correcao.erro && (
            <p role="alert" className="mt-2 text-sm text-content-secondary">
              {correcao.erro}
            </p>
          )}
          {correcao.dados && (
            <>
              {correcao.quando && (
                <p className="mt-4 label-mono">Última correção · {formatDateTime(correcao.quando)}</p>
              )}
              <NoteReview review={correcao.dados} remaining={correcao.restantes} scroll={correcao.restantes !== null} />
              <p className="mt-3 text-center text-sm">
                <Link href="/correcoes" className="font-bold text-content-secondary underline underline-offset-4">
                  Ver todas as minhas correções
                </Link>
              </p>
            </>
          )}
        </div>
      )}
      {erro && (
        <p role="alert" className="mt-2 text-sm text-brick">
          {erro}
        </p>
      )}
    </section>
  );
}
