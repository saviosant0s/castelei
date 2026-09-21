import { TrailModule } from "./TrailModule";
import { buildTrail } from "@/lib/lesson-trail";
import type { LessonSummary } from "@/lib/types";

/**
 * A trilha inteira de uma matéria.
 *
 * Era uma lista vertical de 30 linhas iguais. Trinta linhas não mostram
 * caminho nenhum: não dá para ver onde você está, quanto falta nem o que vem
 * depois — só que é muita coisa.
 */
export function SubjectTrail({ lessons }: { lessons: LessonSummary[] }) {
  const modules = buildTrail(lessons);

  return (
    <div className="space-y-14">
      {modules.map((bloco, index) => (
        <TrailModule key={`${bloco.name ?? "sem-modulo"}-${index}`} module={bloco} />
      ))}
    </div>
  );
}
