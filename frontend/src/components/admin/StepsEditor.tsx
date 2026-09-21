"use client";

import { useState } from "react";
import { Code2, ListTree, Plus } from "lucide-react";
import { TextArea } from "@/components/admin/Form";
import { StepCard } from "@/components/admin/StepCard";
import {
  comApoioVisual,
  etapaVazia,
  inserirApos,
  mover,
  remover,
  trocar,
} from "@/lib/steps";
import type { LessonStep } from "@/lib/types";

/**
 * As etapas da lição.
 *
 * Substitui o campo de JSON cru que havia aqui. O JSON continua existindo como
 * saída, mas escrever nele deixou de ser o único caminho — e era ele a causa de
 * curso inteiro sair só com texto corrido: pôr uma figura exigia escrever JSON à
 * mão, escrever mais um parágrafo não exigia nada.
 *
 * O modo JSON continua disponível para quem chega com o conteúdo pronto (ou
 * gerado por IA) e só quer colar.
 */
export function StepsEditor({
  steps,
  onChange,
  onErroDeJson,
}: {
  steps: LessonStep[];
  onChange: (steps: LessonStep[]) => void;
  onErroDeJson: (mensagem: string | null) => void;
}) {
  const [modoJson, setModoJson] = useState(false);
  const [rascunho, setRascunho] = useState(() => JSON.stringify(steps, null, 2));

  function abrirJson() {
    // Parte do que está nos campos, não do que foi digitado antes: senão o modo
    // JSON mostraria uma versão velha e desfaria o trabalho ao salvar.
    setRascunho(JSON.stringify(steps, null, 2));
    setModoJson(true);
  }

  function digitarJson(texto: string) {
    setRascunho(texto);

    try {
      const lido = JSON.parse(texto);

      if (!Array.isArray(lido)) {
        onErroDeJson("As etapas precisam ser uma lista.");

        return;
      }

      onErroDeJson(null);
      onChange(lido as LessonStep[]);
    } catch (e) {
      /*
      | Avisa mas NÃO devolve as etapas: enquanto o JSON está pela metade, o que
      | vale é a última versão boa. Sem isso, apagar uma chave esvaziaria a
      | lição a cada tecla.
      */
      onErroDeJson(`JSON inválido: ${(e as Error).message}`);
    }
  }

  const comApoio = comApoioVisual(steps);
  const piso = Math.ceil(steps.length / 3);
  const faltaApoio = steps.length >= 6 && comApoio < piso;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-base font-bold">
          {steps.length} {steps.length === 1 ? "etapa" : "etapas"}
        </p>
        <button
          type="button"
          onClick={() => (modoJson ? setModoJson(false) : abrirJson())}
          className="inline-flex items-center gap-2 rounded-control bg-surface-sunken px-3 py-2 text-sm font-bold"
        >
          {modoJson ? <ListTree className="size-4" aria-hidden="true" /> : <Code2 className="size-4" aria-hidden="true" />}
          {modoJson ? "Voltar aos campos" : "Editar como JSON"}
        </button>
      </div>

      {/*
        O medidor do paredão.
        Mostra a mesma conta que o validador faz DEPOIS de salvar — mas aqui,
        enquanto ainda dá para resolver. Um aviso que chega junto com o "salvo"
        raramente faz alguém voltar.
      */}
      <div
        className={`rounded-control px-4 py-3 text-sm ${
          faltaApoio ? "bg-coral-soft text-coral" : "bg-surface-sunken text-content-secondary"
        }`}
      >
        {comApoio === 0 ? (
          <>
            <strong>Nenhuma etapa tem figura, tabela, exemplo ou lista.</strong> Do jeito que está, a lição vai
            ser um paredão de texto no celular. Quem parte do zero precisa de algo para olhar.
          </>
        ) : faltaApoio ? (
          <>
            <strong>
              {comApoio} de {steps.length} etapas
            </strong>{" "}
            têm algo além de parágrafo. Ainda lê como texto corrido — mire em pelo menos {piso}.
          </>
        ) : (
          <>
            <strong>
              {comApoio} de {steps.length} etapas
            </strong>{" "}
            têm figura, tabela, exemplo, código, lista, vídeo ou glossário.
          </>
        )}
      </div>

      {modoJson ? (
        <TextArea
          label="Etapas (JSON)"
          rows={26}
          mono
          value={rascunho}
          onChange={(e) => digitarJson(e.target.value)}
          hint="Para colar conteúdo pronto. Os campos acima continuam valendo: o que estiver aqui é o que vai ser salvo."
        />
      ) : (
        <>
          <ul className="space-y-4">
            {steps.map((step, i) => (
              <StepCard
                key={i}
                step={step}
                indice={i}
                total={steps.length}
                onChange={(novo) => onChange(trocar(steps, i, novo))}
                onRemove={() => onChange(remover(steps, i))}
                onMove={(direcao) => onChange(mover(steps, i, direcao))}
                onInsert={() => onChange(inserirApos(steps, i, etapaVazia()))}
              />
            ))}
          </ul>

          <button
            type="button"
            onClick={() => onChange([...steps, etapaVazia(steps.length === 0 ? "idea" : "explain")])}
            className="inline-flex items-center gap-2 rounded-control bg-surface-sunken px-4 py-2.5 text-base font-bold"
          >
            <Plus className="size-4" aria-hidden="true" /> Etapa no fim
          </button>
        </>
      )}
    </div>
  );
}
