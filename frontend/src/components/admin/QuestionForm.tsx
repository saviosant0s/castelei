"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Aviso, Button, TextArea, TextField } from "@/components/admin/Form";
import { Card } from "@/components/ui";
import { adminFetch } from "@/lib/admin-client";
import { ApiError, messageOf } from "@/lib/client";
import type { AdminQuestion } from "@/lib/admin-types";

const VAZIA = {
  topic: "",
  format: "choice" as const,
  statement: "",
  options: ["", "", "", "", ""],
  correct_index: 0,
  explanation: "",
  pitfall: "",
};

interface Props {
  /** null = questão nova */
  question: AdminQuestion | null;
  lessonId: number;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Uma questão, campo a campo.
 *
 * Aqui não tem JSON: a forma de uma questão é sempre a mesma, e a alternativa
 * certa é marcada no rádio ao lado dela. Escrever "correct_index: 2" à mão é
 * exatamente o erro que ninguém percebe relendo — o rádio torna impossível
 * marcar uma alternativa que não existe.
 */
export function QuestionForm({ question, lessonId, onDone, onCancel }: Props) {
  const router = useRouter();
  const inicial = question ?? VAZIA;

  const [topic, setTopic] = useState(inicial.topic);
  const [statement, setStatement] = useState(inicial.statement);
  const [options, setOptions] = useState<string[]>([...inicial.options]);
  const [correct, setCorrect] = useState(inicial.correct_index);
  const [format, setFormat] = useState<"choice" | "order">(inicial.format ?? "choice");
  const ordenar = format === "order";
  const [explanation, setExplanation] = useState(inicial.explanation);
  const [pitfall, setPitfall] = useState(inicial.pitfall ?? "");

  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string[]>>({});

  function trocarOpcao(index: number, valor: string) {
    setOptions((atuais) => atuais.map((opcao, i) => (i === index ? valor : opcao)));
  }

  function removerOpcao(index: number) {
    setOptions((atuais) => atuais.filter((_, i) => i !== index));
    // Se a certa saiu ou andou para trás, o rádio acompanha em vez de apontar para o vazio.
    if (correct >= index && correct > 0) setCorrect((atual) => atual - 1);
  }

  async function salvar() {
    setBusy(true);
    setErro(null);
    setCampos({});

    const body = {
      topic,
      format,
      statement,
      options,
      correct_index: correct,
      explanation,
      pitfall: pitfall.trim() === "" ? null : pitfall,
    };

    try {
      if (question) await adminFetch(`/questions/${question.id}`, { method: "PUT", body });
      else await adminFetch(`/lessons/${lessonId}/questions`, { method: "POST", body });

      router.refresh();
      onDone();
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.errors).length > 0) setCampos(error.errors);
      else setErro(messageOf(error));
      setBusy(false);
    }
  }

  return (
    <Card tone="outline" className="space-y-4">
      <h3 className="text-xl">{question ? `Questão ${question.position}` : "Nova questão"}</h3>

      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      <TextField
        label="Tópico"
        value={topic}
        onChange={(event) => setTopic(event.target.value)}
        hint="É o que aparece no progresso do aluno como ponto forte ou fraco."
        error={campos.topic?.[0]}
      />

      <TextArea
        label="Enunciado"
        value={statement}
        rows={3}
        onChange={(event) => setStatement(event.target.value)}
        error={campos.statement?.[0]}
      />

      {/*
        O formato é um rádio, e não um menu: são dois, e esconder um deles
        atrás de um clique é o que faz esquecer que existe — a mesma lição dos
        botões de bloco do editor de etapas.
      */}
      <fieldset className="space-y-2">
        <legend className="text-sm text-content-subtle">Como se responde</legend>
        <div className="flex flex-wrap gap-2">
          {([
            ["choice", "Escolher uma alternativa", "Cinco opções, uma certa. É o formato da prova."],
            ["order", "Pôr os passos na ordem", "O app embaralha. Escreva na ordem CERTA."],
          ] as const).map(([valor, rotulo, dica]) => (
            <label
              key={valor}
              className={`flex-1 cursor-pointer rounded-control border-2 px-3 py-2 ${
                format === valor ? "border-sky bg-sky-soft" : "border-ink/15"
              }`}
            >
              <input
                type="radio"
                name="formato"
                checked={format === valor}
                onChange={() => setFormat(valor)}
                className="sr-only"
              />
              <span className="block text-base font-bold">{rotulo}</span>
              <span className="block text-sm text-content-secondary">{dica}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm text-content-subtle">
          {ordenar ? "Os passos, NA ORDEM CERTA — o app embaralha na tela" : "Alternativas — marque a certa"}
        </legend>

        {campos.options?.[0] && <p className="text-sm text-brick">{campos.options[0]}</p>}
        {campos.correct_index?.[0] && <p className="text-sm text-brick">{campos.correct_index[0]}</p>}

        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-3">
            {ordenar ? (
              <span
                aria-hidden="true"
                className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-sunken font-mono text-sm font-bold text-content-secondary"
              >
                {index + 1}
              </span>
            ) : (
              <input
                type="radio"
                name="correta"
                checked={correct === index}
                onChange={() => setCorrect(index)}
                aria-label={`Alternativa ${index + 1} é a certa`}
                className="size-5 shrink-0 accent-[color:var(--color-sage)]"
              />
            )}
            <input
              value={option}
              onChange={(event) => trocarOpcao(index, event.target.value)}
              placeholder={ordenar ? `Passo ${index + 1}` : `Alternativa ${index + 1}`}
              className="w-full rounded-control bg-surface-sunken px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-sky"
            />
            <button
              type="button"
              onClick={() => removerOpcao(index)}
              disabled={options.length <= 2}
              aria-label={`Remover alternativa ${index + 1}`}
              className="shrink-0 rounded p-2 text-content-faint transition hover:text-brick disabled:opacity-30"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </div>
        ))}

        <Button type="button" onClick={() => setOptions((atuais) => [...atuais, ""])} disabled={options.length >= 8}>
          <span className="flex items-center gap-2">
            <Plus className="size-4" aria-hidden="true" />
            Mais uma alternativa
          </span>
        </Button>

        {options.length !== 5 && (
          <p className="text-sm text-content-subtle">
            São {options.length} alternativas. O padrão do Castelei é 5, como nas bancas.
          </p>
        )}
      </fieldset>

      <TextArea
        label="Explicação"
        value={explanation}
        rows={3}
        onChange={(event) => setExplanation(event.target.value)}
        hint="Aparece depois da resposta. Explique por que a certa é certa, não só qual é."
        error={campos.explanation?.[0]}
      />

      <TextArea
        label="Pegadinha"
        value={pitfall}
        rows={2}
        onChange={(event) => setPitfall(event.target.value)}
        hint="Opcional. O aviso extra que aparece quando a pessoa erra."
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
