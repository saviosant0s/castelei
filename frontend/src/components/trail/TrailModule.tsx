import { TrailNode } from "./TrailNode";
import { ProgressBar } from "@/components/ui";
import { trailHeight, trailPath, type TrailModule as Module } from "@/lib/lesson-trail";

/*
| Um módulo da trilha: cabeçalho, quanto já andou, e o caminho em ziguezague.
|
| O módulo que ainda não começou aparece APAGADO, NÃO ESCONDIDO. Ver o
| caminho inteiro à frente é metade do valor da tela — é o que transforma
| "faltam 22 lições" em "faltam estes cinco assuntos". Recolher o que vem
| depois devolveria a sensação de lista, só que com um toque a mais.
*/
export function TrailModule({ module: bloco, className = "" }: { module: Module; className?: string }) {
  const height = trailHeight(bloco.lessons.length);
  const path = trailPath(bloco.lessons.map((item) => item.x));

  return (
    <section className={className} aria-label={bloco.name ? `Módulo ${bloco.number}: ${bloco.name}` : undefined}>
      {bloco.name && (
        <header className="mb-6">
          <p className="font-mono text-xs tracking-wide text-content-subtle uppercase">Módulo {bloco.number}</p>
          <h2 className="mt-1 text-2xl">{bloco.name}</h2>

          <div className="mt-3 flex items-center gap-3">
            <ProgressBar
              percent={bloco.percent}
              size="sm"
              tone={bloco.done === bloco.total ? "sage" : "sky"}
              label={`${bloco.done} de ${bloco.total} lições concluídas`}
              className="flex-1"
            />
            {/* O número vem escrito junto: barra sozinha não diz quanto falta. */}
            <span className="font-mono text-sm font-bold text-content-secondary tabular-nums">
              {bloco.done}/{bloco.total}
            </span>
          </div>
        </header>
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
            className="absolute inset-0 h-full w-full text-ink/15"
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
          <TrailNode key={item.lesson.id} item={item} index={index} />
        ))}
      </div>
    </section>
  );
}
