"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Aviso, Button, TextArea, TextField } from "@/components/admin/Form";
import { Card } from "@/components/ui";
import { adminFetch } from "@/lib/admin-client";
import { ApiError, messageOf } from "@/lib/client";
import type { AdminQuestion } from "@/lib/admin-types";
import { WRITING_CHECKS, type WritingCheckId } from "@/lib/writing";

/** O que cada conferência da forma pede, dito como na tela do aluno. */
const CHECK_LABEL: Record<WritingCheckId, string> = {
  uma_frase: "Uma frase só",
  um_paragrafo: "Um parágrafo só",
  titulo: "Um título na primeira linha",
  conectivo: "Pelo menos um conectivo",
  conclusivo: "Um conectivo de conclusão",
  concessivo: "Admite o outro lado",
  sem_pergunta: "Afirma, não pergunta",
  sem_eu_acho: "Defende sem “eu acho”",
};

interface Props {
  question: AdminQuestion;
  onDone: () => void;
  onCancel: () => void;
}

/** Uma linha por item: é como o roteiro e os critérios se leem na tela. */
const linhas = (texto: string) =>
  texto
    .split("\n")
    .map((linha) => linha.trim())
    .filter((linha) => linha !== "");

/**
 * Uma questão de escrita, campo a campo.
 *
 * Mora à parte do `QuestionForm` porque não tem nada dele: nem alternativa,
 * nem gabarito. Salvar uma questão de escrita pelo formulário comum a
 * transformaria em múltipla escolha e apagaria o roteiro.
 */
export function WritingQuestionForm({ question, onDone, onCancel }: Props) {
  const router = useRouter();
  const folha = question.writing;

  const [topic, setTopic] = useState(question.topic);
  const [statement, setStatement] = useState(question.statement);
  const [steps, setSteps] = useState((folha?.steps ?? []).join("\n"));
  const [checklist, setChecklist] = useState((folha?.checklist ?? []).join("\n"));
  const [model, setModel] = useState(folha?.model ?? "");
  const [placeholder, setPlaceholder] = useState(folha?.placeholder ?? "");
  const [minChars, setMinChars] = useState(String(folha?.min_chars ?? ""));
  const [maxChars, setMaxChars] = useState(String(folha?.max_chars ?? ""));
  const [checks, setChecks] = useState<string[]>(folha?.checks ?? []);
  const [assemble, setAssemble] = useState(folha?.assemble ?? false);
  const [draftOnly, setDraftOnly] = useState(folha?.draft_only ?? false);
  const [examOnly, setExamOnly] = useState(question.exam_only ?? false);
  const [explanation, setExplanation] = useState(question.explanation);
  const [pitfall, setPitfall] = useState(question.pitfall ?? "");

  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string[]>>({});

  function alternar(id: string) {
    setChecks((atuais) => (atuais.includes(id) ? atuais.filter((c) => c !== id) : [...atuais, id]));
  }

  async function salvar() {
    setBusy(true);
    setErro(null);
    setCampos({});

    const numero = (texto: string) => (texto.trim() === "" ? null : Number(texto));

    const body = {
      topic,
      statement,
      explanation,
      pitfall: pitfall.trim() === "" ? null : pitfall,
      exam_only: examOnly,
      writing: {
        steps: linhas(steps),
        checklist: linhas(checklist),
        model,
        placeholder: placeholder.trim() === "" ? null : placeholder,
        min_chars: numero(minChars),
        max_chars: numero(maxChars),
        // Na ordem da lista, não na ordem em que foram marcadas.
        checks: WRITING_CHECKS.filter((id) => checks.includes(id)),
        assemble,
        draft_only: draftOnly,
      },
    };

    try {
      await adminFetch(`/questions/${question.id}`, { method: "PUT", body });
      router.refresh();
      onDone();
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.errors).length > 0) setCampos(error.errors);
      else setErro(messageOf(error));
      setBusy(false);
    }
  }

  const erroDe = (campo: string) => campos[campo]?.[0] ?? campos[`${campo}.0`]?.[0];

  return (
    <Card tone="outline" className="space-y-4">
      <h3 className="text-xl">Questão {question.position} · escrita</h3>

      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      <TextField
        label="Tópico"
        value={topic}
        onChange={(event) => setTopic(event.target.value)}
        hint="É o que aparece no progresso como parte cumprida ou não."
        error={campos.topic?.[0]}
      />

      <TextArea
        label="Proposta"
        value={statement}
        rows={3}
        onChange={(event) => setStatement(event.target.value)}
        error={campos.statement?.[0]}
      />

      <TextArea
        label="Roteiro, um passo por linha"
        value={steps}
        rows={4}
        onChange={(event) => setSteps(event.target.value)}
        hint="Aparece junto da proposta, antes de a pessoa escrever."
        error={erroDe("writing.steps")}
      />

      <TextArea
        label="Critérios da autoavaliação, um por linha"
        value={checklist}
        rows={4}
        onChange={(event) => setChecklist(event.target.value)}
        hint="Só aparecem depois de conferir. Marcar todos é o que conta a parte como cumprida."
        error={erroDe("writing.checklist")}
      />

      <TextArea
        label="Texto-modelo"
        value={model}
        rows={5}
        onChange={(event) => setModel(event.target.value)}
        hint="Só aparece depois de a pessoa conferir o próprio texto. Antes, viraria texto copiado."
        error={campos["writing.model"]?.[0]}
      />

      <TextField
        label="Dica dentro da caixa de texto"
        value={placeholder}
        onChange={(event) => setPlaceholder(event.target.value)}
        hint="Opcional."
        error={campos["writing.placeholder"]?.[0]}
      />

      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Mínimo de caracteres"
          type="number"
          min={0}
          value={minChars}
          onChange={(event) => setMinChars(event.target.value)}
          error={campos["writing.min_chars"]?.[0]}
        />
        <TextField
          label="Máximo de caracteres"
          type="number"
          min={1}
          value={maxChars}
          onChange={(event) => setMaxChars(event.target.value)}
          error={campos["writing.max_chars"]?.[0]}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm text-content-subtle">O que a tela confere enquanto a pessoa escreve</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {WRITING_CHECKS.map((id) => (
            <label key={id} className="flex items-center gap-2 text-base">
              <input
                type="checkbox"
                checked={checks.includes(id)}
                onChange={() => alternar(id)}
                className="size-5 shrink-0 accent-[color:var(--color-sky)]"
              />
              {CHECK_LABEL[id]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm text-content-subtle">Onde esta parte entra</legend>
        {(
          [
            [assemble, setAssemble, "Junta o texto: a caixa já começa com as partes anteriores"],
            [draftOnly, setDraftOnly, "Rascunho: não entra no texto juntado"],
            [examOnly, setExamOnly, "Só no simulado: proposta do texto inteiro"],
          ] as const
        ).map(([valor, trocar, rotulo]) => (
          <label key={rotulo} className="flex items-center gap-2 text-base">
            <input
              type="checkbox"
              checked={valor}
              onChange={(event) => trocar(event.target.checked)}
              className="size-5 shrink-0 accent-[color:var(--color-sky)]"
            />
            {rotulo}
          </label>
        ))}
      </fieldset>

      <TextArea
        label="Explicação"
        value={explanation}
        rows={3}
        onChange={(event) => setExplanation(event.target.value)}
        error={campos.explanation?.[0]}
      />

      <TextArea
        label="Pegadinha"
        value={pitfall}
        rows={2}
        onChange={(event) => setPitfall(event.target.value)}
        hint="Opcional."
      />

      <div className="flex gap-3">
        <Button peso="principal" onClick={salvar} disabled={busy}>
          {busy ? "Salvando…" : "Salvar questão"}
        </Button>
        <Button onClick={onCancel}>Cancelar</Button>
      </div>
    </Card>
  );
}
