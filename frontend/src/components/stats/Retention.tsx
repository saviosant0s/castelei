import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui";
import { pluralize } from "@/lib/format";
import type { StatsResponse } from "@/lib/types";

/** Abaixo disto, parte do que a pessoa acerta está escapando entre as revisões. */
const SEGURA = 80;

/**
 * O que a pessoa já acertou e, vendo de novo, errou.
 *
 * É a medida de memória, e por isso compara com o acerto de primeira vez: o
 * primeiro número diz o quanto se aprende, o segundo o quanto se guarda.
 */
export function Retention({ retention }: { retention: StatsResponse["retention"] }) {
  if (retention.kept_accuracy === null) {
    return (
      <p className="text-base text-content-secondary">
        Quando você praticar de novo uma lição em que já acertou questões, aqui aparece quanto disso ficou na memória.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <Card size="sm" className="!p-0">
        <dl className="grid grid-cols-2 divide-x divide-ink/10">
          <div className="px-3 py-4 text-center">
            <dt className="text-sm text-content-subtle">Na primeira vez</dt>
            <dd className="mt-1 font-mono text-2xl font-medium">{retention.first_accuracy}%</dd>
          </div>
          <div className="px-3 py-4 text-center">
            <dt className="text-sm text-content-subtle">Revendo o que acertou</dt>
            <dd className="mt-1 font-mono text-2xl font-medium">{retention.kept_accuracy}%</dd>
          </div>
        </dl>
      </Card>
      <p className="text-base text-content-secondary">
        {retention.kept_accuracy >= SEGURA
          ? `De ${pluralize(retention.rechecked, "questão", "questões")} que você já tinha acertado e viu de novo, manteve ${retention.kept}. A revisão está segurando.`
          : `De ${pluralize(retention.rechecked, "questão", "questões")} que você já tinha acertado e viu de novo, manteve ${retention.kept}. Parte está escapando: revisar mais cedo ajuda.`}
      </p>

      {retention.forgotten_lessons.length > 0 && (
        <ul className="divide-y divide-ink/10 rounded-card bg-surface-raised shadow-lift">
          {retention.forgotten_lessons.map((l) => (
            <li key={l.lesson_id}>
              <Link href={`/licao/${l.lesson_id}/praticar?erradas=1`} className="flex items-center gap-3 p-4">
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-bold">{l.lesson_title}</span>
                  <span className="block text-sm text-content-subtle">
                    {l.subject_name} · {pluralize(l.forgotten, "questão esquecida", "questões esquecidas")}
                  </span>
                </span>
                <ArrowRight className="size-5 shrink-0 text-content-faint" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
