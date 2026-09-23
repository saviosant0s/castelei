import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Card, EmptyState, ProgressBar } from "@/components/ui";
import { serverGet } from "@/lib/backend";
import { formatSeconds, pluralize } from "@/lib/format";
import { agruparPorLicao, nivel } from "@/lib/progress-groups";
import type { ProgressResponse } from "@/lib/types";

export const metadata: Metadata = { title: "Progresso" };

/** O nível ganha um rótulo em palavras, não só uma cor: cor sozinha exclui. */
const niveis = {
  dominado: { label: "Dominado", chip: "bg-sage-soft", bar: "sage" as const },
  evoluindo: { label: "Evoluindo", chip: "bg-sky-soft", bar: "sky" as const },
  revisar: { label: "Revisar", chip: "bg-coral-soft", bar: "coral" as const },
};

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

  const licoes = agruparPorLicao(topics);

  return (
    <div className="space-y-8">
      {/*
        Uma faixa só, e não três cartões iguais lado a lado: são três leituras
        do mesmo assunto, e cartões separados pediam para ser comparados como
        se fossem coisas diferentes.
      */}
      <Card size="sm" className="!p-0">
        <dl className="grid grid-cols-3 divide-x divide-ink/10">
          {[
            { label: "Respondidas", value: String(overall.answered) },
            { label: "Acerto", value: overall.accuracy !== null ? `${overall.accuracy}%` : "—" },
            { label: "Por questão", value: overall.avg_seconds !== null ? formatSeconds(overall.avg_seconds) : "—" },
          ].map((item) => (
            <div key={item.label} className="min-w-0 px-3 py-4 text-center">
              <dt className="text-sm text-content-subtle">{item.label}</dt>
              <dd className="mt-1 font-mono text-2xl font-medium">{item.value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <section aria-labelledby="licoes">
        <h2 id="licoes" className="text-2xl">Por lição</h2>
        <p className="mt-1 text-base text-content-secondary">
          As que mais precisam de atenção vêm primeiro. Toque numa lição para ver os tópicos.
        </p>
        <ul className="mt-4 space-y-3">
          {licoes.map((licao) => {
            const n = niveis[nivel(licao.accuracy)];

            return (
              <li key={licao.lesson_id}>
                <details className="group rounded-card bg-surface-raised shadow-lift">
                  <summary className="block cursor-pointer list-none p-4 [&::-webkit-details-marker]:hidden">
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block text-base font-bold">{licao.lesson_title}</span>
                        <span className="block text-sm text-content-subtle">{licao.subject_name}</span>
                      </span>
                      <span className={`shrink-0 rounded-pill px-3 py-1 text-sm font-bold ${n.chip}`}>{n.label}</span>
                    </span>
                    <ProgressBar
                      percent={licao.accuracy}
                      tone={n.bar}
                      size="sm"
                      label={`Acerto em ${licao.lesson_title}`}
                      className="mt-3"
                    />
                    <span className="mt-2 flex items-center justify-between gap-3 text-sm">
                      <span className="font-mono text-content-secondary">
                        {licao.accuracy}% · {licao.correct}/{licao.answered} certas
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold text-content-secondary">
                        {pluralize(licao.topics.length, "tópico", "tópicos")}
                        <ChevronDown
                          className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                          aria-hidden="true"
                        />
                      </span>
                    </span>
                  </summary>

                  <div className="border-t border-ink/10 px-4 pb-4">
                    <ul className="divide-y divide-ink/10">
                      {licao.topics.map((topic) => {
                        const tn = niveis[nivel(topic.accuracy)];

                        return (
                          <li key={topic.topic} className="flex items-center gap-3 py-2.5">
                            <span className="min-w-0 flex-1">
                              <span className="block text-base">{topic.topic}</span>
                              <span className="block font-mono text-sm text-content-subtle">
                                {topic.correct}/{topic.answered} certas · {formatSeconds(topic.avg_seconds)}
                              </span>
                            </span>
                            <span className={`shrink-0 rounded-pill px-2.5 py-0.5 text-sm font-bold ${tn.chip}`}>
                              {tn.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <Link href={`/licao/${licao.lesson_id}`} className="btn btn-ghost mt-2 w-full border-2 border-ink/15">
                      Abrir a lição <ArrowRight className="size-5" aria-hidden="true" />
                    </Link>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
