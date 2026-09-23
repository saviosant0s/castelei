import Link from "next/link";
import { Check, Star } from "lucide-react";
import { TrailLabel } from "./TrailLabel";
import { TrailResume } from "./TrailResume";
import { NODE, ROW, type TrailAccent, type TrailLesson, labelSide, stars } from "@/lib/lesson-trail";

/*
| Um nó da trilha.
|
| DUAS COISAS DECIDEM A APARÊNCIA, E SÃO INDEPENDENTES: o módulo escolhe a
| COR, o estado escolhe a FORMA. Assim cor nunca é o único sinal (regra 3 do
| design system) e ainda sobra cor para dizer em que trecho da matéria você
| está.
|
| A que falta é CINZA, MAS CONTINUA CLICÁVEL, e isso é decisão. O app
| acompanha um semestre com data marcada: quem chega na véspera da prova
| querendo revisar Memória não pode esbarrar num cadeado porque pulou uma
| lição de setembro. O cinza orienta ("você ainda não chegou aqui"), não
| proíbe — por isso também não tem cadeado, que prometeria uma tranca que não
| existe.
|
| A LINHA INTEIRA É O LINK, não só o círculo. O título está ao lado do nó, e
| quem toca no título quer abrir a lição — alvo de 60px no meio de uma linha
| de 350px é o tipo de mira que faz errar no celular.
*/
const cores: Record<TrailAccent, string> = {
  sky: "node-sky",
  sage: "node-sage",
  coral: "node-coral",
};

const anel: Record<TrailAccent, string> = {
  sky: "ring-sky",
  sage: "ring-sage",
  coral: "ring-coral",
};

const words = {
  concluida: "concluída",
  atual: "é a próxima",
  adiante: "ainda não praticada",
} as const;

export function TrailNode({ item, index, accent }: { item: TrailLesson; index: number; accent: TrailAccent }) {
  const { lesson, state, x } = item;
  const ganhas = state === "concluida" ? stars(lesson.best_percent) : 0;

  return (
    <Link
      href={`/licao/${lesson.id}`}
      aria-label={
        `Lição ${lesson.position}: ${lesson.title} — ${words[state]}` + (ganhas ? `, ${ganhas} de 3 estrelas` : "")
      }
      className="group absolute inset-x-0 outline-none"
      style={{ top: index * ROW, height: NODE }}
    >
      <span
        aria-hidden="true"
        className={`node absolute top-0 grid -translate-x-1/2 place-items-center rounded-pill font-display text-xl font-bold group-focus-visible:ring-4 group-focus-visible:ring-sky/50 ${
          state === "adiante" ? "node-adiante" : cores[accent]
        }`}
        style={{ left: `${x}%`, width: NODE, height: NODE }}
      >
        {state === "atual" && <span className={`trail-pulse absolute inset-0 rounded-pill ring-4 ${anel[accent]}`} />}
        {state === "concluida" ? <Check className="size-7" strokeWidth={3} /> : lesson.position}
      </span>

      <TrailLabel x={x} side={labelSide(index)} emphasis={state === "atual"}>
        <span
          className={`line-clamp-3 text-[0.9375rem] leading-snug ${
            state === "atual"
              ? "font-bold text-content"
              : state === "adiante"
                ? "text-content-subtle"
                : "font-medium text-content"
          }`}
        >
          {lesson.title}
        </span>

        {/* A linha de baixo tem dono conforme o estado: "Agora" na atual,
            estrelas e a melhor nota na concluída, nada na que falta. */}
        {state === "atual" && (
          <span className="mt-1.5 inline-block rounded-pill bg-surface-bold px-2.5 py-0.5 text-[0.625rem] font-bold tracking-wide text-on-bold uppercase">
            Agora
          </span>
        )}

        {state === "concluida" && (
          <span aria-hidden="true" className="mt-1 inline-flex items-center gap-0.5">
            {[1, 2, 3].map((n) => (
              <Star
                key={n}
                className={`size-3.5 ${n <= ganhas ? "fill-coral text-coral" : "fill-ink/10 text-ink/15"}`}
              />
            ))}
            {lesson.best_percent !== null && (
              <span className="ml-1.5 font-mono text-xs text-content-subtle">{lesson.best_percent}%</span>
            )}
          </span>
        )}

        <TrailResume lessonId={lesson.id} />
      </TrailLabel>
    </Link>
  );
}
