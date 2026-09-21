"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronRight } from "lucide-react";
import { Aviso } from "@/components/admin/Form";
import { Card } from "@/components/ui";
import { adminFetch } from "@/lib/admin-client";
import { messageOf } from "@/lib/client";
import type { AdminLessonRow } from "@/lib/admin-types";

/**
 * As lições da matéria, na ordem em que aparecem para o aluno.
 *
 * A ordem é mexida com setas, e não arrastando: arrastar é ruim no toque, não
 * funciona no teclado e é justamente o tipo de gesto que se dá sem querer numa
 * lista longa. Aqui, sair do lugar exige um clique consciente.
 */
export function LessonList({ subjectId, lessons }: { subjectId: number; lessons: AdminLessonRow[] }) {
  const router = useRouter();
  const [ordem, setOrdem] = useState(lessons);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function mover(index: number, direcao: -1 | 1) {
    const destino = index + direcao;
    if (destino < 0 || destino >= ordem.length) return;

    const nova = [...ordem];
    [nova[index], nova[destino]] = [nova[destino], nova[index]];

    const anterior = ordem;
    setOrdem(nova);
    setBusy(true);
    setErro(null);

    try {
      await adminFetch(`/subjects/${subjectId}/order`, {
        method: "PUT",
        body: { lessons: nova.map((lesson) => lesson.id) },
      });
      router.refresh();
    } catch (error) {
      // A lista volta ao que era: mostrar uma ordem que o servidor não aceitou
      // faria a próxima troca partir de um estado que não existe.
      setOrdem(anterior);
      setErro(messageOf(error));
    } finally {
      setBusy(false);
    }
  }

  if (ordem.length === 0) {
    return (
      <Card tone="dashed">
        <p className="text-base text-content-secondary">
          Esta matéria ainda não tem lições. Crie uma abaixo ou importe um arquivo pronto.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      <ul className="space-y-2">
        {ordem.map((lesson, index) => (
          <li key={lesson.id}>
            <Card size="sm" className="flex items-center gap-3">
              <span className="flex shrink-0 flex-col">
                <button
                  type="button"
                  onClick={() => mover(index, -1)}
                  disabled={busy || index === 0}
                  aria-label={`Mover "${lesson.title}" para cima`}
                  className="rounded p-1 text-content-faint transition hover:text-content disabled:opacity-30"
                >
                  <ArrowUp className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => mover(index, 1)}
                  disabled={busy || index === ordem.length - 1}
                  aria-label={`Mover "${lesson.title}" para baixo`}
                  className="rounded p-1 text-content-faint transition hover:text-content disabled:opacity-30"
                >
                  <ArrowDown className="size-4" aria-hidden="true" />
                </button>
              </span>

              <span className="w-7 shrink-0 text-center font-mono text-sm text-content-subtle">{index + 1}</span>

              <Link href={`/admin/licao/${lesson.id}`} className="min-w-0 flex-1">
                <span className="block text-base font-bold">{lesson.title}</span>
                <span className="mt-0.5 block text-sm text-content-secondary">
                  {lesson.steps_count} {lesson.steps_count === 1 ? "etapa" : "etapas"} · {lesson.questions_count}{" "}
                  {lesson.questions_count === 1 ? "questão" : "questões"} ·{" "}
                  <code className="font-mono text-content-subtle">{lesson.slug}</code>
                </span>
              </Link>

              <ChevronRight className="size-5 shrink-0 text-content-faint" aria-hidden="true" />
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
