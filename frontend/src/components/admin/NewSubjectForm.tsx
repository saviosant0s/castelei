"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Aviso, Button, TextField } from "@/components/admin/Form";
import { Card } from "@/components/ui";
import { adminFetch } from "@/lib/admin-client";
import { ApiError, messageOf } from "@/lib/client";
import type { AdminSubject } from "@/lib/admin-types";

/** Cria uma matéria vazia. Para trazer lições junto, o caminho é a importação. */
export function NewSubjectForm() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string[]>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErro(null);
    setCampos({});

    const data = Object.fromEntries(new FormData(event.currentTarget));

    try {
      const { subject } = await adminFetch<{ subject: AdminSubject }>("/subjects", { method: "POST", body: data });
      router.push(`/admin/materia/${subject.id}`);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.errors).length > 0) setCampos(error.errors);
      else setErro(messageOf(error));
      setBusy(false);
    }
  }

  if (!aberto) {
    return (
      <Button peso="normal" onClick={() => setAberto(true)}>
        <span className="flex items-center gap-2">
          <Plus className="size-4" aria-hidden="true" />
          Nova matéria vazia
        </span>
      </Button>
    );
  }

  return (
    <Card tone="outline">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <h2 className="text-xl">Nova matéria</h2>

        {erro && <Aviso tipo="erro">{erro}</Aviso>}

        <TextField
          label="Nome"
          name="name"
          required
          placeholder="Banco de Dados"
          error={campos.name?.[0]}
        />
        <TextField
          label="Slug"
          name="slug"
          required
          placeholder="banco-de-dados"
          hint="O endereço curto da matéria. Só minúsculas sem acento, números e hífen. Depois de criada, não muda."
          error={campos.slug?.[0]}
        />
        <TextField
          label="Descrição"
          name="description"
          placeholder="Do modelo ao SQL, sem decoreba."
          hint="Opcional. Uma frase que diga a quem a matéria serve."
          error={campos.description?.[0]}
        />

        <div className="flex gap-3">
          <Button type="submit" peso="principal" disabled={busy}>
            {busy ? "Criando…" : "Criar matéria"}
          </Button>
          <Button type="button" onClick={() => setAberto(false)}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
