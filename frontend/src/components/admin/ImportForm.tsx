"use client";

import { useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Download, FileJson } from "lucide-react";
import { Aviso, Button } from "@/components/admin/Form";
import { IssueList } from "@/components/admin/IssueList";
import { Card } from "@/components/ui";
import { adminFetch, ContentError } from "@/lib/admin-client";
import { messageOf } from "@/lib/client";
import type { ContentIssue, ImportReport } from "@/lib/admin-types";

type Resultado =
  | { tipo: "conferido"; warnings: ContentIssue[] }
  | { tipo: "importado"; report: ImportReport };

export function ImportForm() {
  const router = useRouter();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [prune, setPrune] = useState(false);
  const [busy, setBusy] = useState<"conferindo" | "importando" | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [dica, setDica] = useState<string | null>(null);
  const [issues, setIssues] = useState<ContentIssue[]>([]);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  function escolher(event: ChangeEvent<HTMLInputElement>) {
    setArquivo(event.target.files?.[0] ?? null);
    setErro(null);
    setDica(null);
    setIssues([]);
    setResultado(null);
  }

  async function enviar(dryRun: boolean) {
    if (!arquivo) return;

    setBusy(dryRun ? "conferindo" : "importando");
    setErro(null);
    setDica(null);
    setIssues([]);
    setResultado(null);

    const form = new FormData();
    form.append("file", arquivo);
    if (dryRun) form.append("dry_run", "1");
    if (prune) form.append("prune", "1");

    try {
      const data = await adminFetch<{ report?: ImportReport; warnings?: ContentIssue[] }>("/import", {
        method: "POST",
        body: form,
      });

      if (dryRun) setResultado({ tipo: "conferido", warnings: data.warnings ?? [] });
      else {
        setResultado({ tipo: "importado", report: data.report as ImportReport });
        router.refresh();
      }
    } catch (error) {
      setErro(messageOf(error));
      if (error instanceof ContentError) {
        setIssues(error.issues);
        setDica(error.hint ?? null);
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-5">
        <label className="block space-y-2">
          <span className="text-sm text-content-subtle">Arquivo da matéria (.json)</span>
          <input
            type="file"
            accept="application/json,.json"
            onChange={escolher}
            className="block w-full cursor-pointer rounded-control bg-surface-sunken px-4 py-3 text-base file:mr-4 file:cursor-pointer file:rounded-pill file:border-0 file:bg-surface-bold file:px-4 file:py-2 file:text-sm file:font-bold file:text-paper"
          />
        </label>

        {arquivo && (
          <p className="flex items-center gap-2 text-base text-content-secondary">
            <FileJson className="size-4 shrink-0" aria-hidden="true" />
            {arquivo.name} · {(arquivo.size / 1024).toFixed(0)} kB
          </p>
        )}

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={prune}
            onChange={(event) => setPrune(event.target.checked)}
            className="mt-1 size-5 shrink-0 accent-[color:var(--color-sky)]"
          />
          <span className="text-base">
            Apagar o que não está no arquivo
            <span className="mt-0.5 block text-sm text-content-subtle">
              Sem isto, lições e questões que sumiram do arquivo continuam no app e só são apontadas no relatório. Com
              isto ligado elas saem de vez, junto com as respostas de quem já estudou.
            </span>
          </span>
        </label>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => enviar(true)} disabled={!arquivo || busy !== null}>
            {busy === "conferindo" ? "Conferindo…" : "Conferir sem publicar"}
          </Button>
          <Button peso="principal" onClick={() => enviar(false)} disabled={!arquivo || busy !== null}>
            {busy === "importando" ? "Importando…" : "Importar"}
          </Button>
        </div>
      </Card>

      {erro && (
        <div className="space-y-3">
          <Aviso tipo="erro">{erro}</Aviso>
          {dica && <p className="text-base text-content-secondary">{dica}</p>}
          <IssueList issues={issues} tipo="erro" />
        </div>
      )}

      {resultado?.tipo === "conferido" && (
        <div className="space-y-3">
          <Aviso tipo="ok">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />O arquivo está pronto para importar. Nada
              foi gravado ainda.
            </span>
          </Aviso>
          {resultado.warnings.length > 0 && (
            <>
              <p className="text-base text-content-secondary">O Guia Editorial tem ressalvas:</p>
              <IssueList issues={resultado.warnings} tipo="aviso" />
            </>
          )}
        </div>
      )}

      {resultado?.tipo === "importado" && <Relatorio report={resultado.report} />}
    </div>
  );
}

/** O que entrou, em números. É a resposta para "deu certo?". */
function Relatorio({ report }: { report: ImportReport }) {
  const linhas = [
    { rotulo: "Lições criadas", valor: report.lessons_created },
    { rotulo: "Lições atualizadas", valor: report.lessons_updated },
    { rotulo: "Questões criadas", valor: report.questions_created },
    { rotulo: "Questões atualizadas", valor: report.questions_updated },
    ...(report.questions_removed > 0 ? [{ rotulo: "Questões removidas", valor: report.questions_removed }] : []),
  ];

  return (
    <div className="space-y-4">
      <Aviso tipo="ok">
        {report.subject.created ? "Matéria criada" : "Matéria atualizada"}: <strong>{report.subject.name}</strong>.
      </Aviso>

      <Card tone="sunken">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {linhas.map(({ rotulo, valor }) => (
            <div key={rotulo}>
              <dt className="text-sm text-content-subtle">{rotulo}</dt>
              <dd className="font-display text-2xl font-bold">{valor}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {report.orphan_lessons.length > 0 && (
        <Aviso tipo="atencao">
          {report.orphan_lessons.length === 1 ? "Uma lição continua" : `${report.orphan_lessons.length} lições continuam`}{" "}
          no app sem estar no arquivo: {report.orphan_lessons.map((lesson) => lesson.title).join(", ")}. Apague pela tela
          da matéria, ou reimporte marcando &ldquo;apagar o que não está no arquivo&rdquo;.
        </Aviso>
      )}

      {report.orphan_questions.length > 0 && (
        <Aviso tipo="atencao">
          Sobraram questões além das que o arquivo trouxe:{" "}
          {report.orphan_questions.map((item) => `${item.lesson} (${item.count})`).join(", ")}. Elas continuam
          aparecendo para quem estuda.
        </Aviso>
      )}

      {report.warnings.length > 0 && (
        <div className="space-y-2">
          <p className="text-base text-content-secondary">Ressalvas do Guia Editorial:</p>
          <IssueList issues={report.warnings} tipo="aviso" />
        </div>
      )}

      <Link
        href={`/admin/materia/${report.subject.id}`}
        className="inline-block select-none rounded-control bg-surface-bold px-4 py-2.5 text-base font-bold text-paper shadow-lift"
      >
        Abrir {report.subject.name}
      </Link>
    </div>
  );
}

/** O modelo comentado, para servir de base ao pedir o conteúdo para uma IA. */
export function TemplateLink() {
  return (
    <a
      href="/api/admin/import/template"
      download="modelo-conteudo.json"
      className="inline-flex select-none items-center gap-2 rounded-control bg-surface-sunken px-4 py-2.5 text-base font-bold"
    >
      <Download className="size-4" aria-hidden="true" />
      Baixar o modelo
    </a>
  );
}
