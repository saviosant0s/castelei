import Link from "next/link";
import { Check } from "lucide-react";
import { TrailResume } from "./TrailResume";
import { NODE, ROW, type TrailLesson } from "@/lib/lesson-trail";

/*
| Um nó da trilha.
|
| Três estados, e cor nunca é o único sinal de nenhum deles (regra 3 do design
| system): a concluída tem o ícone de certo, a atual tem o anel que pulsa e o
| selo "Agora", e a que falta é lisa, sem relevo. O nome do estado ainda entra
| no rótulo acessível, para quem navega por leitor de tela.
|
| A que falta é CINZA, MAS CONTINUA CLICÁVEL, e isso é decisão. O app
| acompanha um semestre com data marcada: quem chega na véspera da prova
| querendo revisar Memória não pode esbarrar num cadeado porque pulou uma
| lição de setembro. O cinza orienta ("você ainda não chegou aqui"), não
| proíbe — por isso também não tem cadeado, que prometeria uma tranca que não
| existe.
*/
const shapes = {
  concluida: "bg-sage text-white shadow-lift",
  atual: "bg-sky text-ink shadow-sky",
  adiante: "bg-surface-sunken text-content-subtle",
} as const;

const words = {
  concluida: "concluída",
  atual: "é a próxima",
  adiante: "ainda não praticada",
} as const;

export function TrailNode({ item, index }: { item: TrailLesson; index: number }) {
  const { lesson, state, x } = item;

  return (
    <div
      className="absolute flex flex-col items-center text-center"
      // O nó é posicionado pelo centro, em % da largura: a mesma onda serve em
      // qualquer tela, e o traço do SVG atrás se estica junto.
      style={{ left: `${x}%`, top: index * ROW, width: "min(10rem, 48%)", transform: "translateX(-50%)" }}
    >
      <Link
        href={`/licao/${lesson.id}`}
        aria-label={`Lição ${lesson.position}: ${lesson.title} — ${words[state]}`}
        className="group flex flex-col items-center outline-none"
      >
        <span
          aria-hidden="true"
          className={`relative grid place-items-center rounded-pill font-display text-xl font-bold transition-transform group-hover:-translate-y-0.5 group-focus-visible:ring-4 group-focus-visible:ring-sky/50 ${shapes[state]}`}
          style={{ width: NODE, height: NODE }}
        >
          {state === "atual" && <span className="trail-pulse absolute inset-0 rounded-pill ring-4 ring-sky" />}
          {state === "concluida" ? <Check className="size-7" strokeWidth={3} /> : lesson.position}
        </span>

        {state === "atual" && (
          <span className="mt-2 rounded-pill bg-ink px-2.5 py-0.5 text-[0.625rem] font-bold tracking-wide text-paper uppercase">
            Agora
          </span>
        )}

        {/* O título tapa o traço que passa por trás dele — ver .trail-mask. */}
        <span
          className={`trail-mask mt-1.5 line-clamp-3 rounded-control px-1.5 text-xs leading-tight ${
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
