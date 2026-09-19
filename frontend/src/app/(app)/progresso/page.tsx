import type { Metadata } from "next";
import Link from "next/link";
import { serverGet } from "@/lib/backend";
import { formatSeconds } from "@/lib/format";
import type { ProgressResponse } from "@/lib/types";

export const metadata: Metadata = { title: "Progresso" };

function status(accuracy: number) {
  if (accuracy >= 80) return { label: "Dominado", classes: "bg-sage-soft text-ink", bar: "bg-sage" };
  if (accuracy < 50) return { label: "Revisar", classes: "bg-coral-soft text-ink", bar: "bg-coral" };
  return { label: "Evoluindo", classes: "bg-sky-soft text-ink", bar: "bg-sky" };
}

export default async function Progresso() {
  const progress = await serverGet<ProgressResponse>("/progress");
  const { overall, topics } = progress;

  if (overall.attempts === 0) {
    return (
      <div className="space-y-5 pt-6">
        <h1 className="text-4xl">Progresso</h1>
        <p className="text-base text-ink/70">
          Assim que você terminar sua primeira prática, aqui aparecem seu acerto e seu tempo por tópico.
        </p>
        <Link href="/inicio" className="btn btn-primary">Fazer minha primeira lição</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl">Progresso</h1>

      <dl className="grid grid-cols-3 gap-3">
        {[
          { label: "Respondidas", value: String(overall.answered) },
          { label: "Acerto", value: overall.accuracy !== null ? `${overall.accuracy}%` : "—" },
          { label: "Tempo médio", value: overall.avg_seconds !== null ? formatSeconds(overall.avg_seconds) : "—" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl bg-white p-4 shadow-lift">
            <dt className="text-sm text-ink/60">{item.label}</dt>
            <dd className="mt-1 font-mono text-2xl font-medium">{item.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="topicos">
        <h2 id="topicos" className="text-2xl">Por tópico</h2>
        <p className="mt-1 text-base text-ink/70">Os que mais precisam de atenção aparecem primeiro.</p>
        <ul className="mt-4 space-y-3">
          {topics.map((topic) => {
            const s = status(topic.accuracy);
            return (
              <li key={`${topic.lesson_title}-${topic.topic}`} className="rounded-2xl bg-white p-4 shadow-lift">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-bold">{topic.topic}</p>
                    <p className="text-sm text-ink/60">{topic.lesson_title}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${s.classes}`}>{s.label}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10" role="img" aria-label={`Acerto de ${topic.accuracy}%`}>
                  <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${topic.accuracy}%` }} />
                </div>
                <p className="mt-2 font-mono text-sm text-ink/70">
                  {topic.correct}/{topic.answered} certas · {formatSeconds(topic.avg_seconds)} por questão
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
