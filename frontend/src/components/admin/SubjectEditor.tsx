"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Aviso, Button, TextField } from "@/components/admin/Form";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { Card } from "@/components/ui";
import { adminFetch } from "@/lib/admin-client";
import { ApiError, messageOf } from "@/lib/client";
import type { AdminSubjectDetail } from "@/lib/admin-types";

export function SubjectEditor({ subject }: { subject: AdminSubjectDetail }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string[]>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErro(null);
    setSalvo(false);
    setCampos({});

    const data = Object.fromEntries(new FormData(event.currentTarget));

    try {
      await adminFetch(`/subjects/${subject.id}`, { method: "PUT", body: data });
      setSalvo(true);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.errors).length > 0) setCampos(error.errors);
      else setErro(messageOf(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <h2 className="text-xl">Dados da matéria</h2>

          {erro && <Aviso tipo="erro">{erro}</Aviso>}
          {salvo && <Aviso tipo="ok">Salvo.</Aviso>}

          <TextField label="Nome" name="name" defaultValue={subject.name} required error={campos.name?.[0]} />
          <TextField
            label="Descrição"
            name="description"
            defaultValue={subject.description ?? ""}
            error={campos.description?.[0]}
          />
          <TextField
            label="Slug"
            value={subject.slug}
            disabled
            hint="O slug é a identidade da matéria: é por ele que a importação reencontra o que já existe. Trocá-lo criaria outra matéria e deixaria esta para trás, com as tentativas dos alunos presas nela."
          />

          <Button type="submit" peso="principal" disabled={busy}>
            {busy ? "Salvando…" : "Salvar"}
          </Button>
        </form>
      </Card>

      <ConfirmDelete
        path={`/subjects/${subject.id}`}
        nome={subject.name}
        rotulo="Apagar esta matéria"
        aviso={`Isto apaga ${subject.lessons.length} ${
          subject.lessons.length === 1 ? "lição" : "lições"
        }, todas as questões delas e o histórico de quem já estudou esta matéria. Não tem volta.`}
        onDeleted={() => {
          router.push("/admin");
          router.refresh();
        }}
      />
    </div>
  );
}
