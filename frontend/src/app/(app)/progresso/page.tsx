import type { Metadata } from "next";
import { Card, EmptyState, ProgressBar } from "@/components/ui";
import { serverGet } from "@/lib/backend";
import { formatSeconds } from "@/lib/format";
import type { ProgressResponse } from "@/lib/types";

export const metadata: Metadata = { title: "Progresso" };

/** O tópico ganha um rótulo em palavras, não só uma cor: cor sozinha exclui. */
function status(accuracy: number) {
  if (accuracy >= 80) return { label: "Dominado", chip: "bg-sage-soft", bar: "sage" as const };
  if (accuracy < 50) return { label: "Revisar", chip: "bg-coral-soft", bar: "coral" as const };
  return { label: "Evoluindo", chip: "bg-sky-soft", bar: "sky" as const };
}

export default async function Resumo() {
  const { overall, topics } = await serverGet<ProgressResponse>("/progress");

  if (overall.attempts === 0) {
    return (
      <EmptyState
        level="h2"
        title="Ainda não há números"
        description="Assim que você terminar sua primeira prática, aqui aparecem seu acerto e seu tempo por tópico."
        action={{ label: "Fazer minha primeira lição", href: "/inicio" }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <dl className="grid grid-cols-3 gap-3">
        {[
          { label: "Respondidas", value: String(overall.answered) },
          { label: "Acerto", value: overall.accuracy !== null ? `${overall.accuracy}%` : "—" },
          { label: "Tempo médio", value: overall.avg_seconds !== null ? formatSeconds(overall.avg_seconds) : "—" },
        ].map((item) => (
          <Card key={item.label} size="sm" className="min-w-0">
            <dt className="text-sm text-content-subtle">{item.label}</dt>
            <dd className="mt-1 font-mono text-2xl font-medium">{item.value}</dd>
          </Card>
        ))}
      </dl>

      <section aria-labelledby="topicos">
        <h2 id="topicos" className="text-2xl">Por tópico</h2>
        <p className="mt-1 text-base text-content-secondary">Os que mais precisam de atenção aparecem primeiro.</p>
        <ul className="mt-4 space-y-3">
          {topics.map((topic) => {
            const s = status(topic.accuracy);
            return (
              <li key={`${topic.lesson_title}-${topic.topic}`}>
                <Card size="sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-bold">{topic.topic}</p>
                      <p className="text-sm text-content-subtle">{topic.lesson_title}</p>
                    </div>
                    <span className={`shrink-0 rounded-pill px-3 py-1 text-sm font-bold ${s.chip}`}>{s.label}</span>
                  </div>
                  <ProgressBar
                    percent={topic.accuracy}
                    tone={s.bar}
                    size="sm"
                    label={`Acerto em ${topic.topic}`}
                    className="mt-3"
                  />
                  <p className="mt-2 font-mono text-sm text-content-secondary">
                    {topic.correct}/{topic.answered} certas · {formatSeconds(topic.avg_seconds)} por questão
                  </p>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
