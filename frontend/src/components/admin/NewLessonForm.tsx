"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Aviso, Button, TextArea, TextField } from "@/components/admin/Form";
import { IssueList } from "@/components/admin/IssueList";
import { Card } from "@/components/ui";
import { adminFetch, ContentError } from "@/lib/admin-client";
import { ApiError, messageOf } from "@/lib/client";
import type { ContentIssue } from "@/lib/admin-types";

/** As etapas de uma lição recém-criada: o mínimo que o Guia Editorial pede. */
const ETAPAS_INICIAIS = JSON.stringify(
  [
    { kind: "idea", title: "A ideia em uma frase", body: ["Comece pela analogia, nunca pela definição."] },
    { kind: "explain", title: "Explicando", body: ["Uma ideia por etapa."] },
    { kind: "exam", title: "Como cai na prova", body: ["Aqui, e só aqui, entra a linguagem da banca."] },
    { kind: "pitfall", title: "Pegadinhas clássicas", body: ["Os erros mais comuns:"], bullets: ["O primeiro."] },
    { kind: "recap", title: "Resumo", body: ["O que não pode ser esquecido."] },
  ],
  null,
  2,
);

export function NewLessonForm({ subjectId }: { subjectId: number }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [issues, setIssues] = useState<ContentIssue[]>([]);
  const [campos, setCampos] = useState<Record<string, string[]>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErro(null);
    setIssues([]);
    setCampos({});

    const form = new FormData(event.currentTarget);

    let steps: unknown;
    try {
      steps = JSON.parse(String(form.get("steps")));
    } catch {
      setErro("As etapas não são um JSON válido. Confira as vírgulas e as chaves.");
      setBusy(false);
      return;
    }

    try {
      const { lesson } = await adminFetch<{ lesson: { id: number } }>(`/subjects/${subjectId}/lessons`, {
        method: "POST",
        body: {
          slug: form.get("slug"),
          title: form.get("title"),
          summary: form.get("summary"),
          steps,
        },
      });
      router.push(`/admin/licao/${lesson.id}`);
      router.refresh();
    } catch (error) {
      if (error instanceof ContentError) {
        setErro(error.message);
        setIssues(error.issues);
      } else if (error instanceof ApiError && Object.keys(error.errors).length > 0) {
        setCampos(error.errors);
      } else {
        setErro(messageOf(error));
      }
      setBusy(false);
    }
  }

  if (!aberto) {
    return (
      <Button onClick={() => setAberto(true)}>
        <span className="flex items-center gap-2">
          <Plus className="size-4" aria-hidden="true" />
          Nova lição
        </span>
      </Button>
    );
  }

  return (
    <Card tone="outline">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <h2 className="text-xl">Nova lição</h2>

        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        <IssueList issues={issues} tipo="erro" />

        <TextField label="Título" name="title" required error={campos.title?.[0]} />
        <TextField
          label="Slug"
          name="slug"
          required
          hint="Minúsculas sem acento e hífen. Depois de publicada, não mude: é por ele que a importação reconhece a lição."
          error={campos.slug?.[0]}
        />
        <TextField
          label="Resumo"
          name="summary"
          required
          hint="Uma frase que responde: o que eu vou aprender aqui?"
          error={campos.summary?.[0]}
        />
        <TextArea label="Etapas (JSON)" name="steps" rows={14} mono defaultValue={ETAPAS_INICIAIS} />

        <div className="flex gap-3">
          <Button type="submit" peso="principal" disabled={busy}>
            {busy ? "Criando…" : "Criar lição"}
          </Button>
          <Button type="button" onClick={() => setAberto(false)}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
