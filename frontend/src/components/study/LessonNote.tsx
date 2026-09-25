"use client";

import { useEffect, useRef, useState } from "react";
import { NotebookPen } from "lucide-react";
import { getJson, messageOf, putJson } from "@/lib/client";

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

export function LessonNote({ lessonId }: { lessonId: number }) {
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState<Estado>("carregando");
  const [erro, setErro] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    let vivo = true;
    getJson<{ note: { text: string } | null }>(`/api/lessons/${lessonId}/note`)
      .then((data) => {
        if (!vivo) return;
        setTexto(data.note?.text ?? "");
        setEstado("pronto");
      })
      .catch(() => vivo && setEstado("pronto"));
    return () => {
      vivo = false;
    };
  }, [lessonId]);

  function escrever(valor: string) {
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
    <section aria-labelledby={`nota-${lessonId}`} className="mt-8 rounded-card bg-surface-raised px-5 py-4 shadow-lift">
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
      {erro && (
        <p role="alert" className="mt-2 text-sm text-brick">
          {erro}
        </p>
      )}
    </section>
  );
}
