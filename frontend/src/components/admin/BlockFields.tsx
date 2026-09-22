"use client";

import { Plus, X } from "lucide-react";
import { TextArea, TextField } from "@/components/admin/Form";
import { deLinhas, normalizarTabela, paraLinhas, type Bloco } from "@/lib/steps";
import type { LessonStep } from "@/lib/types";

/*
| Os campos de cada bloco de uma etapa.
|
| Cada um recebe o valor e devolve o novo — sem estado próprio. Estado espalhado
| por sub-formulário é como o editor perde alteração: a pessoa digita, o pai
| re-renderiza por outro motivo, e o que ela escreveu some.
*/

interface Props<B extends Bloco> {
  valor: NonNullable<LessonStep[B]>;
  onChange: (valor: NonNullable<LessonStep[B]>) => void;
}

/** Botãozinho de ação dentro de um bloco (juntar linha, tirar coluna). */
function Mini({ children, onClick, titulo }: { children: React.ReactNode; onClick: () => void; titulo: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={titulo}
      aria-label={titulo}
      className="inline-flex size-8 items-center justify-center rounded-control bg-surface-sunken text-content-secondary hover:text-ink"
    >
      {children}
    </button>
  );
}

export function FigureFields({ valor, onChange }: Props<"figure">) {
  return (
    <div className="space-y-3">
      <TextField
        label="Endereço da figura"
        value={valor.src}
        onChange={(e) => onChange({ ...valor, src: e.target.value })}
        placeholder="/figuras/servidor.svg"
        hint="Um SVG do app, ou o endereço que a biblioteca de mídia devolveu."
      />
      {/*
        O texto alternativo vem ANTES da legenda, e com explicação: é o campo
        que mais se esquece e o único que impede alguém de entender a lição.
        O validador reprova figura sem ele.
      */}
      <TextField
        label="Texto alternativo (obrigatório)"
        value={valor.alt}
        onChange={(e) => onChange({ ...valor, alt: e.target.value })}
        placeholder="Um computador recebendo três pedidos ao mesmo tempo"
        hint="Descreva o que a figura mostra, para quem não consegue vê-la. Não repita a legenda."
      />
      <TextField
        label="Legenda"
        value={valor.caption ?? ""}
        onChange={(e) => onChange({ ...valor, caption: e.target.value })}
        hint="A frase embaixo da figura, que diz o que ela ensina."
      />
    </div>
  );
}

export function TableFields({ valor, onChange }: Props<"table">) {
  const tabela = normalizarTabela(valor);

  const trocarCabecalho = (c: number, texto: string) =>
    onChange({ ...tabela, headers: tabela.headers.map((h, i) => (i === c ? texto : h)) });

  const trocarCelula = (l: number, c: number, texto: string) =>
    onChange({
      ...tabela,
      rows: tabela.rows.map((linha, i) => (i === l ? linha.map((v, j) => (j === c ? texto : v)) : linha)),
    });

  return (
    <div className="space-y-3">
      <TextField
        label="Título da tabela"
        value={tabela.label ?? ""}
        onChange={(e) => onChange({ ...tabela, label: e.target.value })}
        placeholder="O mesmo comando nos dois sistemas"
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[30rem] text-sm">
          <thead>
            <tr>
              {tabela.headers.map((h, c) => (
                <th key={c} className="p-1 text-left font-normal">
                  <input
                    value={h}
                    onChange={(e) => trocarCabecalho(c, e.target.value)}
                    aria-label={`Cabeçalho da coluna ${c + 1}`}
                    placeholder={`Coluna ${c + 1}`}
                    className="w-full rounded-control bg-surface-sunken px-2 py-1.5 font-bold outline-none focus:ring-2 focus:ring-sky"
                  />
                </th>
              ))}
              <th className="w-9 p-1">
                {tabela.headers.length > 1 && (
                  <Mini
                    titulo="Tirar a última coluna"
                    onClick={() =>
                      onChange(normalizarTabela({ ...tabela, headers: tabela.headers.slice(0, -1) }))
                    }
                  >
                    <X className="size-4" aria-hidden="true" />
                  </Mini>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {tabela.rows.map((linha, l) => (
              <tr key={l}>
                {linha.map((celula, c) => (
                  <td key={c} className="p-1">
                    <input
                      value={celula}
                      onChange={(e) => trocarCelula(l, c, e.target.value)}
                      aria-label={`Linha ${l + 1}, coluna ${c + 1}`}
                      className="w-full rounded-control bg-surface-sunken px-2 py-1.5 outline-none focus:ring-2 focus:ring-sky"
                    />
                  </td>
                ))}
                <td className="p-1">
                  {tabela.rows.length > 1 && (
                    <Mini
                      titulo={`Tirar a linha ${l + 1}`}
                      onClick={() => onChange({ ...tabela, rows: tabela.rows.filter((_, i) => i !== l) })}
                    >
                      <X className="size-4" aria-hidden="true" />
                    </Mini>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(normalizarTabela({ ...tabela, headers: [...tabela.headers, ""] }))}
          className="inline-flex items-center gap-1.5 rounded-control bg-surface-sunken px-3 py-2 text-sm font-bold"
        >
          <Plus className="size-4" aria-hidden="true" /> Coluna
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...tabela, rows: [...tabela.rows, tabela.headers.map(() => "")] })}
          className="inline-flex items-center gap-1.5 rounded-control bg-surface-sunken px-3 py-2 text-sm font-bold"
        >
          <Plus className="size-4" aria-hidden="true" /> Linha
        </button>
        <label className="ml-auto flex items-center gap-2 text-sm text-content-secondary">
          <input
            type="checkbox"
            checked={tabela.mono ?? false}
            onChange={(e) => onChange({ ...tabela, mono: e.target.checked })}
            className="size-4"
          />
          Fonte de código depois da 1ª coluna
        </label>
      </div>
    </div>
  );
}

export function ExampleFields({ valor, onChange }: Props<"example">) {
  return (
    <div className="space-y-3">
      <TextField
        label="Rótulo"
        value={valor.label}
        onChange={(e) => onChange({ ...valor, label: e.target.value })}
        placeholder="Exemplo"
      />
      <TextArea
        label="Passos"
        rows={4}
        mono
        value={deLinhas(valor.lines)}
        onChange={(e) => onChange({ ...valor, lines: paraLinhas(e.target.value) })}
        hint="Uma linha por passo. A última costuma ser o resultado."
      />
      {/*
        A pergunta é feita do jeito que se responde sem pensar: trocar duas
        linhas de lugar estragaria o exemplo? Perguntar "é ordenado?" faria
        parar para decidir o que a palavra quer dizer.
      */}
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={valor.ordered ?? false}
          onChange={(e) => onChange({ ...valor, ordered: e.target.checked })}
          className="mt-1 size-5 shrink-0 accent-[color:var(--color-sky)]"
        />
        <span>
          <span className="block text-base font-bold">É uma sequência</span>
          <span className="block text-sm text-content-secondary">
            Marque se trocar duas linhas de lugar estragaria o exemplo. A tela desenha os passos numerados, ligados
            por um traço.
          </span>
        </span>
      </label>
    </div>
  );
}

export function CodeFields({ valor, onChange }: Props<"code">) {
  return (
    <div className="space-y-3">
      <TextField
        label="Rótulo"
        value={valor.label ?? ""}
        onChange={(e) => onChange({ ...valor, label: e.target.value })}
        placeholder="No terminal do Linux"
      />
      <TextArea
        label="Código"
        rows={4}
        mono
        value={valor.text}
        onChange={(e) => onChange({ ...valor, text: e.target.value })}
        hint="Linhas curtas, até uns 36 caracteres: a tela do celular é estreita."
      />
      {/*
        A tradução fica AQUI, e não como comentário dentro do código:
        comentário sai em fonte de máquina, foge junto com a linha na rolagem
        lateral e não passa pela conferência do Guia Editorial.
      */}
      <TextArea
        label="O que cada linha faz"
        rows={4}
        value={deLinhas(valor.notes ?? [])}
        onChange={(e) => onChange({ ...valor, notes: paraLinhas(e.target.value) })}
        hint={`Uma frase por linha de código, na ordem. ${contarLinhas(valor.text)} linha(s) de código aqui; escreva o mesmo tanto de frases. Quem lê a lição pode nunca ter visto código.`}
      />
    </div>
  );
}

/** Linhas de verdade do bloco: a linha em branco é respiro, não instrução. */
function contarLinhas(texto: string): number {
  return texto.split("\n").filter((l) => l.trim()).length;
}

export function BulletsFields({ valor, onChange }: Props<"bullets">) {
  return (
    <TextArea
      label="Itens"
      rows={4}
      value={deLinhas(valor)}
      onChange={(e) => onChange(paraLinhas(e.target.value))}
      hint="Um item por linha."
    />
  );
}

export function TermsFields({ valor, onChange }: Props<"terms">) {
  return (
    <div className="space-y-2">
      {valor.map((termo, i) => (
        <div key={i} className="flex items-start gap-2">
          <input
            value={termo.word}
            onChange={(e) => onChange(valor.map((t, j) => (j === i ? { ...t, word: e.target.value } : t)))}
            aria-label={`Palavra ${i + 1}`}
            placeholder="daemon"
            className="w-40 shrink-0 rounded-control bg-surface-sunken px-3 py-2 text-base outline-none focus:ring-2 focus:ring-sky"
          />
          <input
            value={termo.meaning}
            onChange={(e) => onChange(valor.map((t, j) => (j === i ? { ...t, meaning: e.target.value } : t)))}
            aria-label={`Significado de ${termo.word || `palavra ${i + 1}`}`}
            placeholder="programa que fica rodando em segundo plano"
            className="w-full rounded-control bg-surface-sunken px-3 py-2 text-base outline-none focus:ring-2 focus:ring-sky"
          />
          {valor.length > 1 && (
            <Mini titulo={`Tirar a palavra ${i + 1}`} onClick={() => onChange(valor.filter((_, j) => j !== i))}>
              <X className="size-4" aria-hidden="true" />
            </Mini>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...valor, { word: "", meaning: "" }])}
        className="inline-flex items-center gap-1.5 rounded-control bg-surface-sunken px-3 py-2 text-sm font-bold"
      >
        <Plus className="size-4" aria-hidden="true" /> Palavra
      </button>
    </div>
  );
}

export function VideoFields({ valor, onChange }: Props<"video">) {
  return (
    <div className="space-y-3">
      <TextField
        label="Endereço do vídeo"
        value={valor.src}
        onChange={(e) => onChange({ ...valor, src: e.target.value })}
        placeholder="https://www.youtube.com/watch?v=..."
        hint="Um arquivo enviado em /admin/midia, ou um link do YouTube."
      />
      <TextField
        label="Título"
        value={valor.title ?? ""}
        onChange={(e) => onChange({ ...valor, title: e.target.value })}
      />
      <TextField
        label="Legenda"
        value={valor.caption ?? ""}
        onChange={(e) => onChange({ ...valor, caption: e.target.value })}
      />
    </div>
  );
}
