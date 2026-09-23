import { Flag } from "lucide-react";
import { TrailLabel } from "./TrailLabel";
import { NODE, ROW, type TrailAccent, labelSide } from "@/lib/lesson-trail";

/*
| O marco que fecha um trecho da trilha.
|
| Existe para dar um alvo a cada poucos passos. "Faltam 22 lições" não move
| ninguém; "faltam duas para fechar Threads" move.
|
| NÃO É LINK, de propósito: não há para onde ir, e um alvo que responde ao
| toque sem levar a lugar nenhum frustra mais do que enfeita. Ele só acende.
|
| Apagado ele também não tem degrau — não é tecla, é bandeira fincada.
*/
const cores: Record<TrailAccent, string> = {
  sky: "node-sky",
  sage: "node-sage",
  coral: "node-coral",
};

export function TrailMilestone({
  index,
  x,
  accent,
  done,
  total,
  name,
}: {
  index: number;
  x: number;
  accent: TrailAccent;
  done: number;
  total: number;
  name: string | null;
}) {
  const completo = done === total;
  const faltam = total - done;
  const trecho = name ?? "a matéria";
  // "Faltam 1 lição" não existe: o verbo concorda com o número.
  const pendencia = faltam === 1 ? "Falta 1 lição" : `Faltam ${faltam} lições`;

  return (
    <div
      className="absolute inset-x-0"
      style={{ top: index * ROW, height: NODE }}
      role="img"
      aria-label={
        completo
          ? `${trecho}: módulo completo, ${total} de ${total} lições`
          : `${trecho}: ${pendencia.toLowerCase()} para completar`
      }
    >
      <span
        aria-hidden="true"
        className={`node absolute top-0 grid -translate-x-1/2 place-items-center rounded-pill ${completo ? cores[accent] : "node-adiante"}`}
        style={{ left: `${x}%`, width: NODE, height: NODE }}
      >
        <Flag className="size-7" strokeWidth={2.5} />
      </span>

      <TrailLabel x={x} side={labelSide(index)}>
        <span aria-hidden="true" className={`block text-sm ${completo ? "font-bold text-content" : "text-content-subtle"}`}>
          {completo ? "Módulo completo" : pendencia}
        </span>
      </TrailLabel>
    </div>
  );
}
