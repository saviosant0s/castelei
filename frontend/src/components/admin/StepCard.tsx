"use client";

import { ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react";
import { TextArea, TextField } from "@/components/admin/Form";
import {
  BulletsFields,
  CodeFields,
  ExampleFields,
  FigureFields,
  TableFields,
  TermsFields,
  VideoFields,
} from "@/components/admin/BlockFields";
import {
  adicionarBloco,
  BLOCOS,
  deLinhas,
  KINDS,
  NOME_DO_BLOCO,
  PARA_QUE_SERVE,
  paraLinhas,
  removerBloco,
  temBloco,
  type Bloco,
} from "@/lib/steps";
import type { LessonStep, StepKind } from "@/lib/types";

/**
 * Uma etapa: o tipo, o título, os parágrafos e os blocos.
 *
 * Os botões de bloco ficam SEMPRE visíveis, mesmo os não usados, e com a frase
 * do que cada um serve. Escondê-los atrás de um menu é o que faz quem escreve
 * esquecer que existem — e foi assim que um curso inteiro saiu só de parágrafo.
 */
export function StepCard({
  step,
  indice,
  total,
  onChange,
  onRemove,
  onMove,
  onInsert,
}: {
  step: LessonStep;
  indice: number;
  total: number;
  onChange: (step: LessonStep) => void;
  onRemove: () => void;
  onMove: (direcao: -1 | 1) => void;
  onInsert: () => void;
}) {
  const usados = BLOCOS.filter((b) => temBloco(step, b));
  const disponiveis = BLOCOS.filter((b) => !temBloco(step, b));
  const kind = KINDS.find((k) => k.valor === step.kind);

  return (
    <li className="rounded-panel bg-surface-raised p-4 shadow-lift">
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-control bg-surface-sunken font-mono text-sm font-bold">
          {indice + 1}
        </span>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="block space-y-1.5">
              <span className="text-sm text-content-subtle">Tipo</span>
              <select
                value={step.kind}
                onChange={(e) => onChange({ ...step, kind: e.target.value as StepKind })}
                className="rounded-control bg-surface-sunken px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-sky"
              >
                {KINDS.map((k) => (
                  <option key={k.valor} value={k.valor}>
                    {k.nome}
                  </option>
                ))}
              </select>
            </label>
            <p className="flex-1 pb-2.5 text-sm text-content-subtle">{kind?.ajuda}</p>
          </div>

          <TextField
            label="Título da tela"
            value={step.title}
            onChange={(e) => onChange({ ...step, title: e.target.value })}
            placeholder="O que acontece quando o pedido chega"
          />

          <TextArea
            label="Parágrafos"
            rows={4}
            value={deLinhas(step.body)}
            onChange={(e) => onChange({ ...step, body: paraLinhas(e.target.value) })}
            hint="Um parágrafo por linha, curtos. Somados, no máximo 75 palavras — o resto vira outra etapa."
          />

          {usados.map((bloco) => (
            <div key={bloco} className="rounded-control border-2 border-ink/10 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-bold">{NOME_DO_BLOCO[bloco]}</p>
                <button
                  type="button"
                  onClick={() => onChange(removerBloco(step, bloco))}
                  aria-label={`Tirar ${NOME_DO_BLOCO[bloco].toLowerCase()} da etapa ${indice + 1}`}
                  className="inline-flex items-center gap-1.5 rounded-control px-2 py-1 text-sm text-content-secondary hover:text-brick"
                >
                  <X className="size-4" aria-hidden="true" /> Tirar
                </button>
              </div>
              <Campos bloco={bloco} step={step} onChange={onChange} />
            </div>
          ))}

          {disponiveis.length > 0 && (
            <div className="space-y-2 border-t-2 border-ink/10 pt-3">
              <p className="text-sm text-content-subtle">Acrescentar à esta tela:</p>
              <div className="flex flex-wrap gap-2">
                {disponiveis.map((bloco) => (
                  <button
                    key={bloco}
                    type="button"
                    onClick={() => onChange(adicionarBloco(step, bloco))}
                    title={PARA_QUE_SERVE[bloco]}
                    className="inline-flex items-center gap-1.5 rounded-control bg-surface-sunken px-3 py-2 text-sm font-bold hover:text-sky"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    {NOME_DO_BLOCO[bloco]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={indice === 0}
            aria-label={`Subir a etapa ${indice + 1}`}
            className="inline-flex size-8 items-center justify-center rounded-control text-content-secondary hover:bg-surface-sunken disabled:opacity-30"
          >
            <ChevronUp className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={indice === total - 1}
            aria-label={`Descer a etapa ${indice + 1}`}
            className="inline-flex size-8 items-center justify-center rounded-control text-content-secondary hover:bg-surface-sunken disabled:opacity-30"
          >
            <ChevronDown className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onInsert}
            aria-label={`Inserir etapa depois da ${indice + 1}`}
            className="inline-flex size-8 items-center justify-center rounded-control text-content-secondary hover:bg-surface-sunken"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={total === 1}
            aria-label={`Apagar a etapa ${indice + 1}`}
            className="inline-flex size-8 items-center justify-center rounded-control text-content-secondary hover:bg-brick-soft hover:text-brick disabled:opacity-30"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  );
}

/** Despacha para os campos do bloco. Separado só para o cartão acima ficar legível. */
function Campos({
  bloco,
  step,
  onChange,
}: {
  bloco: Bloco;
  step: LessonStep;
  onChange: (step: LessonStep) => void;
}) {
  switch (bloco) {
    case "figure":
      return <FigureFields valor={step.figure!} onChange={(v) => onChange({ ...step, figure: v })} />;
    case "table":
      return <TableFields valor={step.table!} onChange={(v) => onChange({ ...step, table: v })} />;
    case "example":
      return <ExampleFields valor={step.example!} onChange={(v) => onChange({ ...step, example: v })} />;
    case "code":
      return <CodeFields valor={step.code!} onChange={(v) => onChange({ ...step, code: v })} />;
    case "bullets":
      return <BulletsFields valor={step.bullets!} onChange={(v) => onChange({ ...step, bullets: v })} />;
    case "terms":
      return <TermsFields valor={step.terms!} onChange={(v) => onChange({ ...step, terms: v })} />;
    case "video":
      return <VideoFields valor={step.video!} onChange={(v) => onChange({ ...step, video: v })} />;
  }
}
