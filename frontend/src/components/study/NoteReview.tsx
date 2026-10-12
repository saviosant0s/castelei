"use client";

import { useEffect, useRef } from "react";
import { Check, PencilLine, Plus, type LucideIcon } from "lucide-react";

export interface NoteReviewData {
  right: string[];
  wrong: string[];
  missing: string[];
}

/*
| A correção da anotação em três partes, nesta ordem: o que já está certo
| primeiro (quem acabou de explicar precisa saber o que já é seu), depois o
| que corrigir, depois o que faltou. "Corrigir" usa coral, não o vermelho de
| erro: explicar errado e ser corrigido é o exercício funcionando.
|
| Parte vazia some. Uma explicação toda certa não precisa de um "nada a
| corrigir" ocupando tela.
*/
const PARTES: { key: keyof NoteReviewData; title: string; icon: LucideIcon; tone: string }[] = [
  { key: "right", title: "O que você acertou", icon: Check, tone: "bg-sage-soft" },
  { key: "wrong", title: "O que corrigir", icon: PencilLine, tone: "bg-coral-soft" },
  { key: "missing", title: "O que ficou faltando", icon: Plus, tone: "bg-sky-soft" },
];

export function NoteReview({
  review,
  remaining = null,
  scroll = true,
}: {
  review: NoteReviewData;
  remaining?: number | null;
  /** Rolar até a correção quando ela aparece. No histórico, não: são várias. */
  scroll?: boolean;
}) {
  const vazia = PARTES.every((p) => review[p.key].length === 0);

  // A correção vem até a pessoa (como a explicação da questão): ela nasce
  // embaixo do botão, atrás da barra fixa, e ninguém rolaria para achá-la.
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scroll) box.current?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  }, [review, scroll]);

  return (
    <div ref={box} className="mt-4 space-y-3 scroll-mb-40" aria-live="polite">
      {vazia && <p className="text-sm text-content-secondary">A correção voltou vazia. Tente de novo daqui a pouco.</p>}
      {PARTES.filter((p) => review[p.key].length > 0).map(({ key, title, icon: Icon, tone }) => (
        <section key={key} className={`rounded-2xl px-4 py-3 ${tone}`}>
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <Icon className="size-4" aria-hidden="true" /> {title}
          </h3>
          <ul className="mt-2 space-y-2 text-base leading-relaxed">
            {review[key].map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
      {remaining !== null && (
        <p className="text-center text-sm text-content-subtle">
          {remaining === 0 ? "Essa foi a última correção de hoje." : `Ainda dá para corrigir ${remaining} ${remaining === 1 ? "vez" : "vezes"} hoje.`}
        </p>
      )}
    </div>
  );
}
