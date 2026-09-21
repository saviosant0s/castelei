import { FileCode, PenLine } from "lucide-react";
import type { SubjectOrigin } from "@/lib/admin-types";

/**
 * Quem manda nesta matéria.
 *
 * Importa mais do que parece: uma matéria "do código" é recarregada dos
 * arquivos a cada deploy, então editar uma lição dela aqui muda esse estado
 * para sempre — dali em diante o arquivo vira histórico. Sem este selo, a
 * troca aconteceria sem ninguém ver.
 */
export function OriginBadge({ origin }: { origin: SubjectOrigin }) {
  const doCodigo = origin === "seed";
  const Icon = doCodigo ? FileCode : PenLine;

  return (
    <span
      title={
        doCodigo
          ? "Vem dos arquivos do repositório e é recarregada a cada deploy. Editar aqui passa a matéria para o painel."
          : "Editada pelo painel. O deploy não mexe mais nela."
      }
      className={`inline-flex select-none items-center gap-1.5 rounded-pill px-2.5 py-1 text-sm ${
        doCodigo ? "bg-surface-sunken text-content-secondary" : "bg-sky-soft text-content"
      }`}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {doCodigo ? "do código" : "do painel"}
    </span>
  );
}
