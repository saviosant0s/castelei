import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { ProgressBar } from "@/components/ui";

// O ícone gira entre as três cores da marca, pela ordem — nunca vermelho,
// que no Castelei quer dizer erro.
export const tones = ["bg-sky-soft text-sky", "bg-coral-soft text-coral", "bg-sage-soft text-sage"];

interface SubjectRowProps {
  href: string;
  name: string;
  icon: LucideIcon;
  tone: string;
  practiced: number;
  total: number;
  /** A linha de baixo: a próxima lição, ou as matérias da área. */
  detail: string;
}

/*
| Uma linha da lista da tela inicial — de área ou de matéria, com a mesma cara.
|
| É LISTA, não grade de cartões: cartões altos em duas colunas tinham um vão
| vazio no meio, e com seis matérias a tela virou três de rolagem. A linha
| mostra o que a pessoa procura: o nome, quanto falta e o que vem a seguir.
*/
export function SubjectRow({ href, name, icon: Icon, tone, practiced, total, detail }: SubjectRowProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-card bg-surface-raised px-4 py-4 shadow-lift transition hover:-translate-y-0.5"
    >
      <span className={`grid size-12 shrink-0 place-items-center rounded-control ${tone}`}>
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          {/* O nome quebra linha em vez de cortar: "Sistemas Operaci…" não diz qual é. */}
          <span className="min-w-0 font-display text-lg leading-snug font-bold">{name}</span>
          {/* Lições praticadas, não acerto médio: aqui a pergunta é "quanto falta". */}
          <span className="shrink-0 pt-0.5 font-mono text-sm tabular-nums text-content-subtle">
            {practiced}/{total}
          </span>
        </span>
        <ProgressBar
          percent={total > 0 ? (practiced / total) * 100 : 0}
          tone="ink"
          size="sm"
          label={`${name}: ${practiced} de ${total} lições praticadas`}
          className="mt-2"
        />
        <span className="mt-1.5 block truncate text-sm text-content-secondary">{detail}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-content-faint" aria-hidden="true" />
    </Link>
  );
}

/** "Próxima: …" / "Comece por: …" / "Todas as lições praticadas". */
export function nextLessonLine(lessons: { title: string; attempts: number }[]): string {
  const practiced = lessons.filter((lesson) => lesson.attempts > 0).length;
  const proxima = lessons.find((lesson) => lesson.attempts === 0);
  if (!proxima) return "Todas as lições praticadas";
  return `${practiced === 0 ? "Comece por" : "Próxima"}: ${proxima.title}`;
}
