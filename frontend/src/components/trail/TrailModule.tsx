import { TrailMilestone } from "./TrailMilestone";
import { TrailNode } from "./TrailNode";
import { Card, ProgressBar } from "@/components/ui";
import { type TrailAccent, type TrailModule as Module, trailHeight, trailPath, waveX } from "@/lib/lesson-trail";

/*
| Um módulo da trilha: cabeçalho colorido, quanto já andou, o caminho em
| ziguezague e o marco que o fecha.
|
| O módulo que ainda não começou aparece APAGADO, NÃO ESCONDIDO. Ver o
| caminho inteiro à frente é metade do valor da tela — é o que transforma
| "faltam 22 lições" em "faltam estes cinco assuntos". Recolher o que vem
| depois devolveria a sensação de lista, só que com um toque a mais.
*/
const tons: Record<TrailAccent, "sky" | "sage" | "coral"> = {
  sky: "sky",
  sage: "sage",
  coral: "coral",
};

const traco: Record<TrailAccent, string> = {
  sky: "text-sky/45",
  sage: "text-sage/45",
  coral: "text-coral/45",
};

export function TrailModule({ module: bloco, className = "" }: { module: Module; className?: string }) {
  // O marco do fim é um nó como os outros para a geometria: entra na conta da
  // altura, ganha lugar na onda e o traço chega até ele.
  const total = bloco.lessons.length + 1;
  const marcoX = waveX(bloco.lessons.length);
  const height = trailHeight(total);
  const path = trailPath([...bloco.lessons.map((item) => item.x), marcoX]);

  return (
    <section className={className} aria-label={bloco.name ? `Módulo ${bloco.number}: ${bloco.name}` : undefined}>
      {bloco.name && (
        // O cabeçalho é um cartão da cor do módulo. É ele que marca a virada
        // de trecho ao rolar: sem isso, nove módulos passam como um só.
        <Card tone={tons[bloco.accent]} className="mb-6">
          <p className="font-mono text-xs tracking-wide text-content-subtle uppercase">Módulo {bloco.number}</p>
          <h2 className="mt-1 text-2xl">{bloco.name}</h2>

          <div className="mt-3 flex items-center gap-3">
            <ProgressBar
              percent={bloco.percent}
              size="sm"
              tone={bloco.done === bloco.total ? "sage" : "ink"}
              label={`${bloco.done} de ${bloco.total} lições concluídas`}
              className="flex-1"
            />
            {/* O número vem escrito junto: barra sozinha não diz quanto falta. */}
            <span className="font-mono text-sm font-bold text-content-secondary tabular-nums">
              {bloco.done}/{bloco.total}
            </span>
          </div>
        </Card>
      )}

      {/* Apagado o bastante para dizer "você ainda não chegou aqui", claro o
          bastante para continuar legível: quem abre o app pela primeira vez
          tem a matéria inteira à frente, e um cinza forte apagaria a tela. */}
      <div className={`relative mx-auto w-full max-w-sm ${bloco.ahead ? "opacity-75" : ""}`} style={{ height }}>
        {/*
        | O caminho atrás dos nós.
        |
        | O viewBox mistura duas unidades de propósito: x vai de 0 a 100 (a
        | mesma % que posiciona os nós) e y é pixel. Com preserveAspectRatio
        | "none" o desenho estica na horizontal junto com a tela, e o traço só
        | não engorda junto por causa do vector-effect.
        */}
        {path && (
          <svg
            aria-hidden="true"
            className={`absolute inset-0 h-full w-full ${traco[bloco.accent]}`}
            viewBox={`0 0 100 ${height}`}
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d={path}
              stroke="currentColor"
              strokeWidth={4}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              strokeDasharray={bloco.ahead ? "1 10" : undefined}
            />
          </svg>
        )}

        {bloco.lessons.map((item, index) => (
          <TrailNode key={item.lesson.id} item={item} index={index} accent={bloco.accent} />
        ))}

        <TrailMilestone
          index={bloco.lessons.length}
          x={marcoX}
          accent={bloco.accent}
          done={bloco.done}
          total={bloco.total}
          name={bloco.name}
        />
      </div>
    </section>
  );
}
