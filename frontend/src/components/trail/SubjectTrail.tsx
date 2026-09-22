import { TrailModule } from "./TrailModule";
import { buildTrail } from "@/lib/lesson-trail";
import type { LessonSummary } from "@/lib/types";

/**
 * A trilha inteira de uma matéria.
 *
 * Era uma lista vertical de 30 linhas iguais. Trinta linhas não mostram
 * caminho nenhum: não dá para ver onde você está, quanto falta nem o que vem
 * depois — só que é muita coisa.
 *
 * AS SEÇÕES FICAM COLADAS, SEM ESPAÇO ENTRE ELAS. Isto aqui já foi
 * `space-y-14`, e parece a mesma coisa — não é. O cabeçalho de cada módulo
 * gruda no topo enquanto a caixa de conteúdo da SEÇÃO dele está na tela;
 * espaço entre as seções fica fora dessa caixa, e o topo da tela passaria
 * alguns pixels sem cabeçalho nenhum a cada virada. O respiro mora dentro do
 * módulo (ver `TrailModule`), e assim um cabeçalho entrega o topo ao outro.
 */
export function SubjectTrail({ lessons }: { lessons: LessonSummary[] }) {
  const modules = buildTrail(lessons);

  return (
    <div>
      {modules.map((bloco, index) => (
        <TrailModule key={`${bloco.name ?? "sem-modulo"}-${index}`} module={bloco} />
      ))}
    </div>
  );
}
