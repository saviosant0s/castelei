import Link from "next/link";
import { Check, Star } from "lucide-react";
import { TrailResume } from "./TrailResume";
import { NODE, ROW, type TrailAccent, type TrailLesson, stars } from "@/lib/lesson-trail";

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
    <div
      className="absolute flex flex-col items-center text-center"
      // O nó é posicionado pelo centro, em % da largura: a mesma onda serve em
      // qualquer tela, e o traço do SVG atrás se estica junto.
      style={{ left: `${x}%`, top: index * ROW, width: "min(10rem, 48%)", transform: "translateX(-50%)" }}
    >
      <Link
        href={`/licao/${lesson.id}`}
        aria-label={
          `Lição ${lesson.position}: ${lesson.title} — ${words[state]}` +
          (ganhas ? `, ${ganhas} de 3 estrelas` : "")
        }
        className="group flex flex-col items-center outline-none"
      >
        <span
          aria-hidden="true"
          className={`node relative grid place-items-center rounded-pill font-display text-xl font-bold group-focus-visible:ring-4 group-focus-visible:ring-sky/50 ${
            state === "adiante" ? "node-adiante" : cores[accent]
          }`}
          style={{ width: NODE, height: NODE }}
        >
          {state === "atual" && (
            <span className={`trail-pulse absolute inset-0 rounded-pill ring-4 ${anel[accent]}`} />
          )}
          {state === "concluida" ? <Check className="size-7" strokeWidth={3} /> : lesson.position}
        </span>

        {/*
        | A faixa embaixo do nó tem dono conforme o estado: "Agora" na atual,
        | estrelas na concluída, nada na que falta. É sempre a mesma altura, e
        | é isso que impede a trilha de dançar conforme a pessoa avança.
        */}
        {state === "atual" && (
          <span className="mt-2.5 rounded-pill bg-surface-bold px-2.5 py-0.5 text-[0.625rem] font-bold tracking-wide text-on-bold uppercase">
            Agora
          </span>
        )}

        {state === "concluida" && (
          <span aria-hidden="true" className="mt-2.5 flex gap-0.5">
            {[1, 2, 3].map((n) => (
              <Star
                key={n}
                className={`size-3.5 ${n <= ganhas ? "fill-coral text-coral" : "fill-ink/10 text-ink/15"}`}
              />
            ))}
          </span>
        )}

        <span
          className={`mt-1.5 line-clamp-3 rounded-control bg-surface-raised px-2 py-1 text-xs leading-tight shadow-lift ${
            state === "adiante" ? "text-content-subtle" : "text-content-secondary"
          } ${state === "atual" ? "font-bold text-content" : ""}`}
        >
          {lesson.title}
        </span>
      </Link>

      <TrailResume lessonId={lesson.id} />
    </div>
  );
}
