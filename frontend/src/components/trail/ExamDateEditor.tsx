"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { ApiError, messageOf, putJson } from "@/lib/client";
import { contagemParaProva, hojeNoFuso } from "@/lib/subject-summary";

/** O dia seguinte a "AAAA-MM-DD": a prova precisa ser depois de hoje. */
function amanha(hoje: string): string {
  const d = new Date(`${hoje}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * A data da prova, marcada por quem estuda.
 *
 * Decisão do Sávio: quem sabe quando é a prova é a pessoa, e não quem
 * escreve a matéria. É dessa data que sai o ritmo das revisões; sem ela, o
 * app usa o FSRS (ver docs/revisao-espacada.md). Por isso o convite explica
 * o que a data muda, em vez de só pedir um número.
 */
export function ExamDateEditor({ subjectId, examDate }: { subjectId: number; examDate: string | null }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(examDate ?? "");
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const prova = contagemParaProva(examDate);

  async function salvar(data: string | null) {
    setBusy(true);
    setErro(null);
    try {
      await putJson(`/api/subjects/${subjectId}/exam-date`, { exam_date: data });
      setEditando(false);
      router.refresh();
    } catch (error) {
      setErro(error instanceof ApiError && error.errors.exam_date ? error.errors.exam_date[0] : messageOf(error));
    } finally {
      setBusy(false);
    }
  }

  if (editando) {
    return (
      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (valor) void salvar(valor);
        }}
      >
        <label className="block text-base font-bold" htmlFor={`prova-${subjectId}`}>
          Quando é a sua prova?
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id={`prova-${subjectId}`}
            type="date"
            min={amanha(hojeNoFuso())}
            value={valor}
            onChange={(event) => setValor(event.target.value)}
            className="min-h-11 rounded-control border-2 border-ink/15 bg-surface-raised px-3 text-base"
            required
          />
          <button type="submit" disabled={busy || !valor} className="btn btn-primary min-h-11 px-4">
            {busy ? "Salvando…" : "Salvar"}
          </button>
          <button type="button" onClick={() => setEditando(false)} className="min-h-11 px-2 text-sm font-bold underline underline-offset-4">
            Cancelar
          </button>
        </div>
        {examDate && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void salvar(null)}
            className="min-h-11 text-sm text-content-secondary underline underline-offset-4"
          >
            Tirar a data da prova
          </button>
        )}
        {erro && (
          <p role="alert" className="text-sm text-brick">
            {erro}
          </p>
        )}
      </form>
    );
  }

  if (prova) {
    return (
      <p className="flex items-start gap-2.5 text-base">
        <CalendarDays className="mt-0.5 size-5 shrink-0 text-sky" aria-hidden="true" />
        <span>
          <strong>{prova.frase}</strong>
          <span className="text-content-secondary"> — {prova.data}. </span>
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="text-sm font-bold underline underline-offset-4"
          >
            Mudar
          </button>
        </span>
      </p>
    );
  }

  return (
    <div className="flex items-start gap-2.5 text-base">
      <CalendarDays className="mt-0.5 size-5 shrink-0 text-sky" aria-hidden="true" />
      <div>
        <p className="text-content-secondary">
          Tem prova marcada? Com a data, as revisões seguem o seu prazo e apertam o ritmo conforme ela chega.
        </p>
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="mt-1 min-h-11 font-bold underline underline-offset-4"
        >
          Marcar a data da prova
        </button>
      </div>
    </div>
  );
}
