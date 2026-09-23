import { ChevronRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { quandoVence, ultimoResultado } from "@/lib/review";
import type { ReviewItem } from "@/lib/types";

/**
 * Uma lição na fila de revisão.
 *
 * Não usa `ListRow` porque precisa de três informações empilhadas (matéria,
 * prazo, última nota) e o `ListRow` foi feito para título + uma linha de apoio.
 * Forçar não caberia em tela de celular sem truncar o que importa.
 *
 * O atraso NÃO é vermelho. Vermelho no Castelei quer dizer erro, e estar
 * atrasado numa revisão não é erro — é o motivo de o app existir.
 */
export function ReviewRow({ item }: { item: ReviewItem }) {
  if (item.lesson_id === null) return null;

  const nota = ultimoResultado(item.last_percent);
  const prazo = quandoVence(item.days_late);

  return (
    <li>
      <Card href={`/licao/${item.lesson_id}`} size="sm" className="flex items-center gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-control bg-sky-soft text-sky">
          <RotateCcw className="size-5" aria-hidden={true} />
        </span>
        <span className="min-w-0 flex-1">
          {/*
            `line-clamp-2`, nunca `truncate`: Sistemas Operacionais tem duas
            lições que começam com "Chamadas de sistema:" e três com
            "Threads". Cortar na primeira linha deixaria linhas idênticas na
            fila, e a pessoa não saberia qual está abrindo.
          */}
          <span className="line-clamp-2 text-base leading-tight font-bold">{item.lesson_title}</span>
          <span className="mt-0.5 block truncate text-sm text-content-subtle">{item.subject_name}</span>
          <span className="mt-0.5 block text-sm text-content-secondary">
            {prazo}
            {nota && ` · ${nota}`}
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-content-faint" aria-hidden={true} />
      </Card>
    </li>
  );
}

/** A fila inteira. `limite` corta a lista quando ela aparece fora da tela da revisão. */
export function ReviewList({ itens, limite }: { itens: ReviewItem[]; limite?: number }) {
  const mostrados = limite ? itens.slice(0, limite) : itens;
  const restantes = itens.length - mostrados.length;

  return (
    <>
      <ul className="space-y-3">
        {mostrados.map((item) => (
          <ReviewRow key={item.lesson_id} item={item} />
        ))}
      </ul>
      {restantes > 0 && (
        <Link href="/revisar" className="mt-3 inline-block font-bold text-sky">
          Ver {restantes === 1 ? "mais 1" : `as outras ${restantes}`}
        </Link>
      )}
    </>
  );
}
