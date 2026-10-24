"use client";

import { useEffect, useState } from "react";
import { getJson } from "@/lib/client";
import { LessonDoubts, type Doubt } from "./LessonDoubts";
import { LessonNote } from "./LessonNote";

/*
| A caixa do fim da lição: tirar uma dúvida ou explicar com as próprias
| palavras.
|
| A dúvida vem primeiro, e é a aba aberta. Explicar para si mesmo fixa
| muito, mas no uso real o Sávio quase nunca tinha o que explicar: tinha o
| que perguntar. As duas continuam aqui, e a anotação segue guardando
| sozinha.
|
| Sem a IA ligada no servidor não há como responder, então a caixa vira só a
| anotação, sem abas.
*/
type Aba = "duvida" | "anotacao";

export function LessonStudyBox({ lessonId }: { lessonId: number }) {
  const [dados, setDados] = useState<{ ai: boolean; doubts: Doubt[] } | null>(null);
  const [aba, setAba] = useState<Aba>("duvida");

  useEffect(() => {
    let vivo = true;
    getJson<{ ai: boolean; doubts: Doubt[] }>(`/api/lessons/${lessonId}/doubts`)
      .then((d) => vivo && setDados(d))
      .catch(() => vivo && setDados({ ai: false, doubts: [] }));
    return () => {
      vivo = false;
    };
  }, [lessonId]);

  if (dados && !dados.ai) return <LessonNote lessonId={lessonId} />;

  return (
    <section className="mt-8 rounded-card bg-surface-raised px-5 py-4 shadow-lift">
      <div role="tablist" aria-label="No fim da lição" className="flex gap-1 rounded-full bg-surface-sunken p-1">
        {(
          [
            ["duvida", "Tirar uma dúvida"],
            ["anotacao", "Explicar com minhas palavras"],
          ] as const
        ).map(([id, rotulo]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={aba === id}
            onClick={() => setAba(id)}
            className={`min-h-11 flex-1 rounded-full px-3 text-sm font-bold transition ${
              aba === id ? "bg-surface-raised shadow-lift" : "text-content-secondary"
            }`}
          >
            {rotulo}
          </button>
        ))}
      </div>
      <div className="mt-4" role="tabpanel">
        {aba === "duvida" ? (
          dados ? (
            <LessonDoubts lessonId={lessonId} initial={dados.doubts} />
          ) : (
            <p className="text-sm text-content-subtle">Carregando…</p>
          )
        ) : (
          <LessonNote lessonId={lessonId} bare />
        )}
      </div>
    </section>
  );
}
