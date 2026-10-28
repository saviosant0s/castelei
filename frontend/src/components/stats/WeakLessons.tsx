import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus } from "lucide-react";
import { pluralize } from "@/lib/format";
import type { WeakLesson } from "@/lib/types";

/*
| A tendência compara a última resposta com a primeira das mesmas questões.
| Piorar é coral, nunca vermelho: vermelho no app é erro, e esquecer não é.
*/
const TREND = {
  up: { label: "melhorando", icon: ArrowUpRight, chip: "bg-sage-soft" },
  down: { label: "piorando", icon: ArrowDownRight, chip: "bg-coral-soft" },
  flat: { label: "parada", icon: Minus, chip: "bg-surface-sunken" },
} as const;

export function WeakLessons({ lessons }: { lessons: WeakLesson[] }) {
  if (lessons.length === 0) {
    return (
      <p className="text-base text-content-secondary">
        Nenhuma lição abaixo de 80% por enquanto. Quando alguma escorregar, ela aparece aqui.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-ink/10 rounded-card bg-surface-raised shadow-lift">
      {lessons.map((l) => {
        const trend = l.trend ? TREND[l.trend] : null;
        const erradas = pluralize(l.wrong, "errada", "erradas");

        return (
          <li key={l.lesson_id}>
            <Link
              href={`/licao/${l.lesson_id}/praticar?erradas=1`}
              className="flex items-center gap-3 p-4"
              aria-label={`${l.lesson_title}: ${l.accuracy}% de acerto, ${erradas}${trend ? `, ${trend.label}` : ""}. Refazer as erradas`}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-base font-bold">{l.lesson_title}</span>
                <span className="block text-sm text-content-subtle">{l.subject_name}</span>
                <span className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-mono">
                    {l.accuracy}% · {erradas}
                  </span>
                  {trend ? (
                    <span className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 font-bold ${trend.chip}`}>
                      <trend.icon className="size-3.5" aria-hidden="true" />
                      {trend.label}
                      {l.trend !== "flat" && <span className="font-mono font-normal">(era {l.first_accuracy}%)</span>}
                    </span>
                  ) : (
                    <span className="text-content-subtle">praticada uma vez</span>
                  )}
                </span>
              </span>
              <ArrowRight className="size-5 shrink-0 text-content-faint" aria-hidden="true" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
