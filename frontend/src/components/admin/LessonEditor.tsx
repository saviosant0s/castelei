"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Aviso, Button, TextArea, TextField } from "@/components/admin/Form";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { IssueList } from "@/components/admin/IssueList";
import { Card } from "@/components/ui";
import { adminFetch, ContentError } from "@/lib/admin-client";
import { ApiError, messageOf } from "@/lib/client";
import type { AdminLessonDetail, ContentIssue } from "@/lib/admin-types";

/**
 * O texto da lição: título, resumo e as etapas.
 *
 * As etapas são editadas como JSON, e isso é escolha, não preguiça. Uma etapa
 * pode ter tabela, figura, vídeo, código, exemplo e palavras explicadas — um
 * formulário com todos esses campos viraria uma tela impossível de ler, e o
 * fluxo que este painel serve é outro: a IA gera o JSON, o painel confere e
 * publica. O que o painel garante é que nada entra sem conferência.
 */
export function LessonEditor({ lesson }: { lesson: AdminLessonDetail }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [issues, setIssues] = useState<ContentIssue[]>([]);
  const [avisos, setAvisos] = useState<ContentIssue[]>([]);
  const [campos, setCampos] = useState<Record<string, string[]>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErro(null);
    setSalvo(false);
    setIssues([]);
    setAvisos([]);
    setCampos({});

    const form = new FormData(event.currentTarget);

    let steps: unknown;
    try {
      steps = JSON.parse(String(form.get("steps")));
    } catch (parseError) {
      setErro(`As etapas não são um JSON válido: ${(parseError as Error).message}`);
      setBusy(false);
      return;
    }

    try {
      const resposta = await adminFetch<{ warnings: ContentIssue[] }>(`/lessons/${lesson.id}`, {
        method: "PUT",
        body: { title: form.get("title"), summary: form.get("summary"), steps },
      });
      setSalvo(true);
      setAvisos(resposta.warnings ?? []);
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
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {erro && <Aviso tipo="erro">{erro}</Aviso>}
          {salvo && <Aviso tipo="ok">Salvo. Já está no ar para quem estuda.</Aviso>}

          <IssueList issues={issues} tipo="erro" />

          {avisos.length > 0 && (
            <div className="space-y-2">
              <p className="text-base text-content-secondary">
                Salvou, mas o Guia Editorial tem ressalvas:
              </p>
              <IssueList issues={avisos} tipo="aviso" />
            </div>
          )}

          <TextField label="Título" name="title" defaultValue={lesson.title} required error={campos.title?.[0]} />
          <TextField
            label="Resumo"
            name="summary"
            defaultValue={lesson.summary}
            required
            hint="Uma frase que responde: o que eu vou aprender aqui?"
            error={campos.summary?.[0]}
          />
          <TextField
            label="Slug"
            value={lesson.slug}
            disabled
            hint="Identidade da lição. Trocá-lo faria a próxima importação tratá-la como lição nova."
          />
          <TextArea
            label={`Etapas (JSON) — ${lesson.steps.length} ${lesson.steps.length === 1 ? "etapa" : "etapas"}`}
            name="steps"
            rows={26}
            mono
            defaultValue={JSON.stringify(lesson.steps, null, 2)}
            hint="Cada etapa é uma tela. Tipos: idea, explain, exam, pitfall, recap. Blocos opcionais: bullets, terms, example, figure, video, code, table."
          />

          <Button type="submit" peso="principal" disabled={busy}>
            {busy ? "Salvando…" : "Salvar lição"}
          </Button>
        </form>
      </Card>

      <ConfirmDelete
        path={`/lessons/${lesson.id}`}
        nome={lesson.title}
        rotulo="Apagar esta lição"
        aviso={`Isto apaga as ${lesson.questions.length} questões da lição e o histórico de quem já a estudou. Não tem volta.`}
        onDeleted={() => {
          router.push(`/admin/materia/${lesson.subject.id}`);
          router.refresh();
        }}
      />
    </div>
  );
}
