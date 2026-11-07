"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, postJson } from "@/lib/client";

/** Criar a turma: um nome e a matéria que a turma vai estudar. */
export function CreateClassroomForm({ subjects }: { subjects: { id: number; name: string }[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          const { classroom } = await postJson<{ classroom: { id: number } }>("/api/classrooms", {
            name,
            subject_id: Number(subjectId),
          });
          router.push(`/turmas/${classroom.id}`);
        } catch (err) {
          setError(err instanceof ApiError ? err.message : "Algo deu errado. Tente de novo.");
          setBusy(false);
        }
      }}
    >
      <div>
        <label htmlFor="turma-nome" className="mb-1.5 block font-bold">
          Nome da turma
        </label>
        <input
          id="turma-nome"
          className="field"
          placeholder="Ex.: 3º ano B, Cursinho de sábado"
          maxLength={80}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="turma-materia" className="mb-1.5 block font-bold">
          Matéria
        </label>
        <select id="turma-materia" className="field" required value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="" disabled>
            Escolha a matéria
          </option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p role="alert" className="rounded-2xl bg-brick-soft px-4 py-3 text-base text-brick">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary w-full" disabled={busy || !name.trim() || !subjectId}>
        {busy ? "Criando…" : "Criar turma"}
      </button>
    </form>
  );
}
