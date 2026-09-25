"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, RotateCcw, X } from "lucide-react";
import { ProgressBar } from "@/components/ui";
import { pluralize } from "@/lib/format";
import type { VocabularyTerm } from "@/lib/types";

/*
| Cartões de vocabulário: a palavra na frente, o significado atrás.
|
| O gesto que importa é TENTAR LEMBRAR antes de virar — é isso que fixa, e
| não reler o significado. Por isso o cartão começa só com a palavra, e a
| pessoa diz com honestidade se lembrou. Não há "certo" e "errado" aqui, e
| nada vai para a nota: é treino, e o único juiz é quem está treinando.
*/
export function Flashcards({ subject, cards }: { subject: { slug: string; name: string }; cards: VocabularyTerm[] }) {
  const router = useRouter();
  const [fila, setFila] = useState(cards);
  const [indice, setIndice] = useState(0);
  const [virado, setVirado] = useState(false);
  const [esquecidas, setEsquecidas] = useState<VocabularyTerm[]>([]);

  const voltar = `/materia/${subject.slug}/vocabulario`;
  const carta = fila[indice];

  function responder(lembrou: boolean) {
    if (!lembrou) setEsquecidas((e) => [...e, carta]);
    setVirado(false);
    setIndice((i) => i + 1);
  }

  function recomecar(novas: VocabularyTerm[]) {
    setFila(novas);
    setIndice(0);
    setVirado(false);
    setEsquecidas([]);
  }

  if (fila.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-base">Ainda não há palavras para treinar nesta matéria.</p>
        <Link href={voltar} className="btn btn-primary w-full">Voltar ao vocabulário</Link>
      </div>
    );
  }

  if (!carta) {
    const lembradas = fila.length - esquecidas.length;
    return (
      <div className="space-y-6">
        <header>
          <p className="label-mono">Cartões · {subject.name}</p>
          <h1 className="mt-1 text-4xl">
            {esquecidas.length === 0 ? "Lembrou de todas!" : `Lembrou de ${lembradas} de ${fila.length}`}
          </h1>
        </header>

        {esquecidas.length > 0 && (
          <section aria-labelledby="rever">
            <h2 id="rever" className="text-xl">Para rever</h2>
            <ul className="mt-3 space-y-2">
              {esquecidas.map((t) => (
                <li key={t.word} className="rounded-card bg-surface-raised px-4 py-3 shadow-lift">
                  <span className="block font-bold">{t.word}</span>
                  <span className="mt-0.5 block text-base">{t.meaning}</span>
                  <Link href={`/licao/${t.lesson.id}`} className="mt-1 block text-sm text-content-subtle underline underline-offset-4">
                    {t.lesson.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="space-y-3">
          {esquecidas.length > 0 && (
            <button type="button" className="btn btn-primary w-full" onClick={() => recomecar(esquecidas)}>
              <RotateCcw className="size-5" aria-hidden="true" /> Treinar só {pluralize(esquecidas.length, "a que esqueci", "as que esqueci")}
            </button>
          )}
          <button type="button" className="btn btn-ghost w-full border-2 border-ink/15" onClick={() => router.refresh()}>
            Outra rodada
          </button>
          <Link href={voltar} className="btn btn-ghost w-full">
            <ArrowLeft className="size-5" aria-hidden="true" /> Voltar ao vocabulário
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col">
      <div className="flex items-center justify-between gap-3">
        <Link href={voltar} aria-label="Sair dos cartões" className="grid size-11 place-items-center rounded-full text-content-secondary hover:bg-ink/5">
          <X className="size-6" aria-hidden="true" />
        </Link>
        <p className="font-mono text-sm text-content-subtle">
          {indice + 1} de {fila.length}
        </p>
      </div>
      <ProgressBar percent={(indice / fila.length) * 100} size="sm" tone="sky" label={`Carta ${indice + 1} de ${fila.length}`} className="mt-2" />

      <button
        type="button"
        onClick={() => setVirado(true)}
        aria-label={virado ? undefined : `${carta.word}: toque para ver o significado`}
        aria-live="polite"
        className={`mt-8 flex min-h-72 flex-1 flex-col items-center justify-center rounded-panel bg-surface-raised px-6 py-8 text-center shadow-lift transition ${virado ? "cursor-default" : ""}`}
      >
        <span className="font-display text-3xl font-bold break-words">{carta.word}</span>
        {virado ? (
          <>
            <span className="mt-5 block text-lg leading-relaxed text-content">{carta.meaning}</span>
            <span className="mt-4 block text-sm text-content-subtle">{carta.lesson.title}</span>
          </>
        ) : (
          <span className="mt-5 block text-base text-content-subtle">Tente lembrar o significado. Depois toque para conferir.</span>
        )}
      </button>

      <div className="mt-6 flex gap-3 pb-4">
        {virado ? (
          <>
            <button type="button" className="btn btn-ghost flex-1 border-2 border-ink/15" onClick={() => responder(false)}>
              <RotateCcw className="size-5" aria-hidden="true" /> Esqueci
            </button>
            <button type="button" className="btn btn-primary flex-1" onClick={() => responder(true)}>
              <Check className="size-5" aria-hidden="true" /> Lembrei
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-primary flex-1" onClick={() => setVirado(true)}>
            Mostrar o significado
          </button>
        )}
      </div>
    </div>
  );
}
