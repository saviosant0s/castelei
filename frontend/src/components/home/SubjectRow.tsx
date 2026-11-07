import Link from "next/link";
import { ChevronRight, Clock, type LucideIcon } from "lucide-react";
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
  /**
   * O número da matéria na ordem de estudo da área. Com ele, o número toma
   * o lugar do ícone: na tela da área quase toda matéria tem o ícone da
   * própria área, e o número diz o que o ícone repetido não diz.
   */
  step?: number;
}

/*
| Uma linha da lista de matérias, na tela da área.
|
| É LISTA, não grade de cartões: cartões altos em duas colunas tinham um vão
| vazio no meio, e com seis matérias a tela virou três de rolagem. A linha
| mostra o que a pessoa procura: o nome, quanto falta e o que vem a seguir.
| As áreas, na tela inicial, são outra peça (`AreaTile`): ali o que importa é
| ver o catálogo inteiro de uma vez, e a matéria seguinte fica para depois.
*/
export function SubjectRow({ href, name, icon: Icon, tone, practiced, total, detail, step }: SubjectRowProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-card bg-surface-raised px-4 py-4 shadow-lift transition hover:-translate-y-0.5"
    >
      <span className={`grid size-12 shrink-0 place-items-center rounded-control ${tone}`}>
        {step !== undefined ? (
          <span className="font-display text-xl font-bold tabular-nums">
            <span className="sr-only">Passo </span>
            {step}
          </span>
        ) : (
          <Icon className="size-6" aria-hidden="true" />
        )}
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

/*
| Um assunto que ainda vai entrar: apagado, com "Em breve", e sem ser link.
|
| Pedido do Sávio: mostrar que o app está andando. Não é link de propósito —
| não há para onde ir, e alvo que responde ao toque sem levar a lugar nenhum
| frustra (a mesma decisão dos blocos "Em breve" da tela inicial). Por isso
| também não tem sombra nem seta: nada nele diz "toque aqui".
*/
export function SoonRow({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-4 rounded-card border border-dashed border-ink/15 px-4 py-3 text-content-subtle">
      <span className="grid size-12 shrink-0 place-items-center rounded-control bg-ink/5">
        <Clock className="size-5 text-content-faint" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 font-display text-base leading-snug font-bold">{name}</span>
      <span className="shrink-0 rounded-pill bg-ink/5 px-2.5 py-1 text-xs font-bold">Em breve</span>
    </div>
  );
}
