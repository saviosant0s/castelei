import Link from "next/link";
import { Check } from "lucide-react";
import { Card } from "@/components/ui";
import { mapModules, mapState, readiness, type MapState } from "@/lib/stats";
import { pluralize } from "@/lib/format";
import type { StatsSubject } from "@/lib/types";

/*
| O estado ganha palavra e forma, não só cor: o dominado leva um certo no
| lugar do número, e a lição nunca praticada é só o contorno tracejado — a
| mesma convenção do Card `dashed`, "existe, mas ainda não é seu".
*/
export const MAP_STATES: Record<MapState, { label: string; cell: string }> = {
  dominado: { label: "Dominada", cell: "bg-sage text-on-accent" },
  evoluindo: { label: "Evoluindo", cell: "bg-sky-soft" },
  revisar: { label: "Revisar", cell: "bg-coral-soft" },
  nova: { label: "Ainda não praticada", cell: "border-2 border-dashed border-ink/20 text-content-subtle" },
};

/**
 * Prontidão e mapa de uma matéria, num cartão só.
 *
 * As duas respondem a mesma pergunta — estou pronto? —, uma em número e a
 * outra em forma. Separadas, a pessoa leria "8 de 30" num lugar e teria que
 * procurar QUAIS oito em outro.
 */
export function SubjectMap({ subject }: { subject: StatsSubject }) {
  const modulos = mapModules(subject.lessons);

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-xl">
          <Link href={`/materia/${subject.slug}`} className="hover:underline">
            {subject.name}
          </Link>
        </h3>
        {subject.days_to_exam !== null && (
          <span className="shrink-0 rounded-pill bg-surface-sunken px-3 py-1 font-mono text-sm">
            prova em {pluralize(subject.days_to_exam, "dia", "dias")}
          </span>
        )}
      </div>

      <div>
        <p className="text-base">
          <span className="font-mono text-3xl font-medium">{subject.lessons_mastered}</span>
          <span className="text-content-secondary">
            {" "}
            de {subject.lessons_total} {subject.lessons_total === 1 ? "lição dominada" : "lições dominadas"}
          </span>
        </p>
        <p className="mt-1 text-base text-content-secondary">{readiness(subject)}</p>
      </div>

      <div className="space-y-3">
        {modulos.map((modulo, i) => (
          <div key={`${modulo.name ?? "sem-modulo"}-${i}`}>
            {modulo.name && <p className="mb-1.5 text-sm text-content-subtle">{modulo.name}</p>}
            <ul className="flex flex-wrap gap-1.5">
              {modulo.lessons.map((lesson) => {
                const estado = mapState(lesson);
                const s = MAP_STATES[estado];
                const nota = lesson.mastery === null ? "" : `, ${lesson.mastery}%`;

                return (
                  <li key={lesson.id}>
                    <Link
                      href={`/licao/${lesson.id}`}
                      title={`${lesson.title}: ${s.label.toLowerCase()}${nota}`}
                      aria-label={`Lição ${lesson.number}, ${lesson.title}: ${s.label.toLowerCase()}${nota}`}
                      className={`flex size-9 items-center justify-center rounded-control font-mono text-sm font-medium ${s.cell}`}
                    >
                      {estado === "dominado" ? <Check className="size-4" aria-hidden="true" /> : lesson.number}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}

/** A legenda vale para todos os mapas da tela, então aparece uma vez só. */
export function MapLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-content-secondary">
      {(Object.keys(MAP_STATES) as MapState[]).map((estado) => (
        <li key={estado} className="flex items-center gap-1.5">
          <span aria-hidden="true" className={`inline-flex size-4 items-center justify-center rounded-[4px] ${MAP_STATES[estado].cell}`}>
            {estado === "dominado" && <Check className="size-3" />}
          </span>
          {MAP_STATES[estado].label}
        </li>
      ))}
    </ul>
  );
}
