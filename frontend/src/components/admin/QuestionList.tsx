"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { Aviso, Button } from "@/components/admin/Form";
import { QuestionForm } from "@/components/admin/QuestionForm";
import { Card } from "@/components/ui";
import { adminFetch } from "@/lib/admin-client";
import { messageOf } from "@/lib/client";
import type { AdminQuestion } from "@/lib/admin-types";

export function QuestionList({ lessonId, questions }: { lessonId: number; questions: AdminQuestion[] }) {
  const router = useRouter();
  const [editando, setEditando] = useState<number | "nova" | null>(null);
  const [apagando, setApagando] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function apagar(question: AdminQuestion) {
    setApagando(question.id);
    setErro(null);

    try {
      await adminFetch(`/questions/${question.id}`, { method: "DELETE" });
      router.refresh();
    } catch (error) {
      setErro(messageOf(error));
    } finally {
      setApagando(null);
    }
  }

  return (
    <div className="space-y-3">
      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      {questions.length !== 8 && (
        <Aviso tipo="atencao">
          Esta lição tem {questions.length} {questions.length === 1 ? "questão" : "questões"}. O site público anuncia 8
          por lição — fora desse número, a vitrine promete o que o app não entrega.
        </Aviso>
      )}

      <ul className="space-y-2">
        {questions.map((question) => (
          <li key={question.id}>
            {editando === question.id ? (
              <QuestionForm
                question={question}
                lessonId={lessonId}
                onDone={() => setEditando(null)}
                onCancel={() => setEditando(null)}
              />
            ) : (
              <Card size="sm" className="flex items-start gap-3">
                <span className="w-7 shrink-0 pt-0.5 text-center font-mono text-sm text-content-subtle">
                  {question.position}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-base">{question.statement}</span>
                  {/*
                    Na questão de ordenar não existe "a certa": o gabarito é a
                    sequência inteira, e mostrar a primeira opção com um certo
                    verde ao lado diria uma coisa que não é verdade.
                  */}
                  <span className="mt-1 flex items-start gap-1.5 text-sm text-content-secondary">
                    <Check className="size-4 shrink-0 text-sage" aria-hidden="true" />
                    <span>
                      {question.format === "order"
                        ? question.options.join(" → ")
                        : question.options[question.correct_index]}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-content-subtle">
                    {question.topic} ·{" "}
                    {question.format === "order"
                      ? `${question.options.length} passos para ordenar`
                      : `${question.options.length} alternativas`}
                  </span>
                </span>

                <span className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => setEditando(question.id)}
                    aria-label={`Editar a questão ${question.position}`}
                    className="rounded p-2 text-content-faint transition hover:text-content"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => apagar(question)}
                    disabled={apagando === question.id}
                    aria-label={`Apagar a questão ${question.position}`}
                    className="rounded p-2 text-content-faint transition hover:text-brick disabled:opacity-40"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </span>
              </Card>
            )}
          </li>
        ))}
      </ul>

      {editando === "nova" ? (
        <QuestionForm
          question={null}
          lessonId={lessonId}
          onDone={() => setEditando(null)}
          onCancel={() => setEditando(null)}
        />
      ) : (
        <Button onClick={() => setEditando("nova")}>
          <span className="flex items-center gap-2">
            <Plus className="size-4" aria-hidden="true" />
            Nova questão
          </span>
        </Button>
      )}
    </div>
  );
}
