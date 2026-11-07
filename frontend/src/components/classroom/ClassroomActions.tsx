"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, deleteJson, postJson } from "@/lib/client";
import { ConfirmAction } from "./ConfirmAction";

/** Entrar na turma, depois de ler o aviso de que o professor vai ver o progresso. */
export function JoinButton({ code }: { code: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="rounded-2xl bg-brick-soft px-4 py-3 text-base text-brick">
          {error}
        </p>
      )}
      <button
        type="button"
        className="btn btn-primary w-full"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            const { classroom } = await postJson<{ classroom: { id: number } }>("/api/classrooms/join", { code });
            router.push(`/turmas/${classroom.id}`);
            router.refresh();
          } catch (e) {
            setError(e instanceof ApiError ? e.message : "Não deu para entrar na turma. Tente de novo.");
            setBusy(false);
          }
        }}
      >
        {busy ? "Entrando…" : "Entrar na turma"}
      </button>
    </div>
  );
}

export function LeaveButton({ classroomId }: { classroomId: number }) {
  const router = useRouter();
  return (
    <ConfirmAction
      label="Sair da turma"
      warning="Você sai da turma, e o professor deixa de ver o seu progresso nesta matéria. O que você estudou continua com você."
      confirmLabel="Sair"
      run={async () => {
        await deleteJson(`/api/classrooms/${classroomId}/membership`);
        router.push("/turmas");
        router.refresh();
      }}
    />
  );
}

export function RemoveMemberButton({ classroomId, userId, name }: { classroomId: number; userId: number; name: string }) {
  const router = useRouter();
  return (
    <ConfirmAction
      compact
      label="Tirar"
      warning={`${name} sai da turma, e você deixa de ver o progresso dele. Ele pode voltar com o código.`}
      confirmLabel="Tirar da turma"
      run={async () => {
        await deleteJson(`/api/classrooms/${classroomId}/members/${userId}`);
        router.refresh();
      }}
    />
  );
}

export function DeleteClassroomButton({ classroomId }: { classroomId: number }) {
  const router = useRouter();
  return (
    <ConfirmAction
      label="Apagar a turma"
      warning="A turma some para todos, e o código para de funcionar. O que cada aluno estudou continua com ele."
      confirmLabel="Apagar"
      run={async () => {
        await deleteJson(`/api/classrooms/${classroomId}`);
        router.push("/turmas");
        router.refresh();
      }}
    />
  );
}
