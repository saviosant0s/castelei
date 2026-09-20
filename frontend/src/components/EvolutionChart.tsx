"use client";

import { useId, useState } from "react";
import { formatSeconds } from "@/lib/format";
import type { EvolutionPoint } from "@/lib/types";

/**
 * Gráfico de evolução: uma linha por medida, nunca as duas no mesmo eixo.
 * Acerto e tempo têm escalas diferentes — juntá-las num eixo só mentiria
 * sobre a relação entre elas.
 */
type Measure = "accuracy" | "time";

const VIEW_W = 320;
const VIEW_H = 120;
const PAD_X = 10;
const PAD_TOP = 14;
const PAD_BOTTOM = 18;

export function EvolutionChart({ points }: { points: EvolutionPoint[] }) {
  // Uma tentativa sozinha não desenha evolução nenhuma.
  if (points.length < 2) return null;

  return (
    <section aria-labelledby="evolucao" className="space-y-4">
      <div>
        <h2 id="evolucao" className="text-2xl">Sua evolução</h2>
        <p className="mt-1 text-sm text-ink/60">
          Suas últimas {points.length} práticas, da mais antiga para a mais recente.
        </p>
      </div>

      <Chart points={points} measure="accuracy" />
      <Chart points={points} measure="time" />

      <details className="rounded-2xl bg-white px-5 py-4 shadow-lift">
        <summary className="min-h-11 cursor-pointer text-base font-bold">Ver os números</summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-ink/60">
                <th scope="col" className="py-1.5 pr-3 font-medium">Prática</th>
                <th scope="col" className="py-1.5 pr-3 font-medium">Acerto</th>
                <th scope="col" className="py-1.5 font-medium">Tempo médio</th>
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((point) => (
                <tr key={point.attempt_id} className="border-t border-ink/10">
                  <th scope="row" className="max-w-[12rem] truncate py-2 pr-3 font-normal">{point.title}</th>
                  <td className="py-2 pr-3 font-mono">{point.percent}%</td>
                  <td className="py-2 font-mono">
                    {point.avg_seconds === null ? "—" : formatSeconds(point.avg_seconds)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

function Chart({ points, measure }: { points: EvolutionPoint[]; measure: Measure }) {
  const gradientId = useId();
  const [active, setActive] = useState<number | null>(null);

  const isAccuracy = measure === "accuracy";
  const color = isAccuracy ? "var(--color-sky)" : "var(--color-coral)";
  const label = isAccuracy ? "Acerto por prática" : "Tempo médio por questão";

  const values = points.map((p) => (isAccuracy ? p.percent : (p.avg_seconds ?? 0)));
  // O acerto tem escala fixa de 0 a 100; o tempo se ajusta aos dados, com folga.
  const max = isAccuracy ? 100 : Math.max(...values, 1) * 1.15;
  const min = 0;

  const x = (i: number) => PAD_X + (i * (VIEW_W - PAD_X * 2)) / Math.max(points.length - 1, 1);
  const y = (v: number) =>
    PAD_TOP + (1 - (v - min) / Math.max(max - min, 1)) * (VIEW_H - PAD_TOP - PAD_BOTTOM);

  const line = values.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L ${x(values.length - 1).toFixed(1)} ${VIEW_H - PAD_BOTTOM} L ${x(0).toFixed(1)} ${VIEW_H - PAD_BOTTOM} Z`;

  const lastIndex = values.length - 1;
  const shown = active ?? lastIndex;
  const point = points[shown];
  const reading = isAccuracy
    ? `${point.percent}%`
    : point.avg_seconds === null
      ? "—"
      : formatSeconds(point.avg_seconds);

  const first = values[0];
  const last = values[lastIndex];
  // No tempo, menor é melhor: a leitura de "melhorou" se inverte.
  const better = isAccuracy ? last > first : last < first;
  const same = last === first;

  return (
    <figure className="rounded-2xl bg-white px-5 py-4 shadow-lift">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-ink/60">{label}</span>
        <span className="font-mono text-2xl font-medium">{reading}</span>
      </figcaption>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="mt-2 w-full"
        style={{ height: "auto" }}
        role="img"
        aria-label={`${label}: ${points.length} práticas, da mais antiga (${isAccuracy ? `${points[0].percent}%` : formatSeconds(values[0])}) para a mais recente (${reading}).`}
        onMouseLeave={() => setActive(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grade discreta: só a base e o meio, para não competir com os dados. */}
        {[0, 0.5, 1].map((t) => {
          const gy = PAD_TOP + t * (VIEW_H - PAD_TOP - PAD_BOTTOM);
          return (
            <line
              key={t}
              x1={PAD_X}
              y1={gy}
              x2={VIEW_W - PAD_X}
              y2={gy}
              stroke="var(--color-ink)"
              strokeOpacity={t === 1 ? 0.18 : 0.08}
              strokeWidth="1"
            />
          );
        })}

        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {values.map((v, i) => (
          <circle
            key={points[i].attempt_id}
            cx={x(i)}
            cy={y(v)}
            r={i === shown ? 5 : 3.5}
            fill={color}
            stroke="white"
            strokeWidth="2"
          />
        ))}

        {/* Alvos de toque bem maiores que os pontos. */}
        {values.map((v, i) => (
          <rect
            key={`hit-${points[i].attempt_id}`}
            x={x(i) - 16}
            y={0}
            width={32}
            height={VIEW_H}
            fill="transparent"
            onMouseEnter={() => setActive(i)}
          />
        ))}
      </svg>

      <p className="mt-1 truncate text-sm text-ink/60" aria-live="polite">
        {point.title}
      </p>

      {!same && (
        <p className={`mt-1 text-sm font-bold ${better ? "text-sage" : "text-ink/60"}`}>
          {isAccuracy
            ? better
              ? "Seu acerto subiu desde a primeira destas práticas."
              : "Seu acerto caiu um pouco — vale revisar os pontos fracos."
            : better
              ? "Você está resolvendo mais rápido do que antes."
              : "Você está levando mais tempo — questões novas costumam pesar no começo."}
        </p>
      )}
    </figure>
  );
}
