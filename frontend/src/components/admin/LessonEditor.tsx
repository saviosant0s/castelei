"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Aviso, Button, TextField } from "@/components/admin/Form";
import { StepsEditor } from "@/components/admin/StepsEditor";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { IssueList } from "@/components/admin/IssueList";
import { Card } from "@/components/ui";
import { adminFetch, ContentError } from "@/lib/admin-client";
import { ApiError, messageOf } from "@/lib/client";
import { limpar } from "@/lib/steps";
import type { AdminLessonDetail, ContentIssue } from "@/lib/admin-types";
import type { LessonStep } from "@/lib/types";

/**
 * O texto da lição: título, resumo e as etapas.
 *
 * As etapas já foram um campo de JSON cru, apostando que o fluxo seria sempre
 * "a IA gera, o painel confere e publica". A aposta quebrou na primeira vez que
 * alguém escreveu um curso à mão por aqui: pôr uma figura exigia escrever JSON,
 * escrever mais um parágrafo não exigia nada, e saiu um curso inteiro de texto
 * corrido. A ferramenta ensinou isso.
 *
 * Agora são campos, com os blocos visuais sempre à vista, e o modo JSON continua
 * ali para quem chega com o conteúdo pronto.
 */
export function LessonEditor({ lesson }: { lesson: AdminLessonDetail }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [issues, setIssues] = useState<ContentIssue[]>([]);
  const [avisos, setAvisos] = useState<ContentIssue[]>([]);
  const [campos, setCampos] = useState<Record<string, string[]>>({});
  const [steps, setSteps] = useState<LessonStep[]>(lesson.steps);
  const [erroDeJson, setErroDeJson] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErro(null);
    setSalvo(false);
    setIssues([]);
    setAvisos([]);
    setCampos({});

    const form = new FormData(event.currentTarget);

    if (erroDeJson) {
      setErro(`Conserte o JSON das etapas antes de salvar. ${erroDeJson}`);
      setBusy(false);
      return;
    }

    try {
      const resposta = await adminFetch<{ warnings: ContentIssue[] }>(`/lessons/${lesson.id}`, {
        method: "PUT",
        body: {
          title: form.get("title"),
          module: form.get("module"),
          summary: form.get("summary"),
          // `limpar` tira campo opcional vazio: sem isso o arquivo exportado
          // encheria de `caption: ""` e `label: ""`, que é ruído para quem lê.
          steps: steps.map(limpar),
        },
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
            label="Módulo"
            name="module"
            defaultValue={lesson.module ?? ""}
            hint="O assunto que agrupa a lição na trilha, ex.: Processos. Lições seguidas com o mesmo nome viram um módulo. Deixe em branco para ficar fora."
            error={campos.module?.[0]}
          />
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
          <StepsEditor steps={steps} onChange={setSteps} onErroDeJson={setErroDeJson} />

          {erroDeJson && <Aviso tipo="erro">{erroDeJson}</Aviso>}

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
