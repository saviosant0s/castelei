import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, ChevronRight } from "lucide-react";
import { ProgressBar } from "@/components/ui";
import { serverGet } from "@/lib/backend";
import { trailView, type TrailStepView } from "@/lib/trails";
import type { SubjectsResponse } from "@/lib/types";

export const metadata: Metadata = { title: "Trilha" };

/*
| A trilha em ordem: um passo por matéria, numerado.
|
| É a resposta a "por onde eu começo?" quando o objetivo atravessa áreas.
| Nada é trancado, como na trilha da matéria: o número orienta, e quem já
| sabe Python pode pular direto para Álgebra Linear.
*/
export default async function TrilhaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { trails, subjects } = await serverGet<SubjectsResponse>("/subjects");
  const trail = (trails ?? []).find((t) => t.slug === slug);
  if (!trail) notFound();

  const passos = trailView(trail, subjects);
  const feitos = passos.filter((p) => p.state === "done").length;

  return (
    <div className="space-y-6">
      <Link href="/inicio" className="inline-flex min-h-11 items-center gap-2 text-base text-content-secondary hover:text-ink">
        <ArrowLeft className="size-5" aria-hidden="true" /> Início
      </Link>

      <header>
        <p className="label-mono">Trilha de estudo</p>
        <h1 className="mt-1 text-4xl">{trail.name}</h1>
        <p className="mt-3 text-base text-content-secondary">{trail.description}</p>
        <ProgressBar
          percent={(feitos / passos.length) * 100}
          tone="ink"
          size="sm"
          label={`${feitos} de ${passos.length} passos concluídos`}
          className="mt-4"
        />
        <p className="mt-1.5 font-mono text-sm tabular-nums text-content-subtle">
          {feitos}/{passos.length} passos
        </p>
      </header>

      <ol className="relative">
        {passos.map((passo, i) => (
          <li key={passo.subject} className="relative flex gap-4 pb-5">
            {/* O traço liga um número ao próximo: é a ordem que se vê, não só se lê. */}
            {i < passos.length - 1 && (
              <span aria-hidden="true" className="absolute top-11 bottom-0 left-[21px] w-0.5 bg-ink/15" />
            )}
            <Numero passo={passo} />
            <Passo passo={passo} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function Numero({ passo }: { passo: TrailStepView }) {
  const estilos = {
    done: "bg-sage text-on-accent",
    current: "bg-sky text-on-accent ring-4 ring-sky/25",
    open: "bg-surface-raised text-content shadow-lift",
    soon: "bg-surface-sunken text-content-faint",
  } as const;

  return (
    <span className={`relative z-10 grid size-11 shrink-0 place-items-center rounded-full font-display text-lg font-bold ${estilos[passo.state]}`}>
      {passo.state === "done" ? <Check className="size-5" aria-label="concluído" /> : passo.number}
    </span>
  );
}

function Passo({ passo }: { passo: TrailStepView }) {
  const corpo = (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0 font-display text-lg leading-snug font-bold">{passo.name}</span>
        {passo.state === "soon" ? (
          <span className="shrink-0 rounded-pill bg-surface-sunken px-2.5 py-0.5 font-mono text-xs text-content-subtle">Em breve</span>
        ) : (
          <span className="shrink-0 pt-0.5 font-mono text-sm tabular-nums text-content-subtle">
            {passo.practiced}/{passo.total}
          </span>
        )}
      </span>
      <span className="mt-1 block text-sm text-content-secondary">{passo.why}</span>
      {passo.state !== "soon" && (
        <>
          <ProgressBar
            percent={passo.total > 0 ? (passo.practiced / passo.total) * 100 : 0}
            tone="ink"
            size="sm"
            label={`${passo.name}: ${passo.practiced} de ${passo.total} lições praticadas`}
            className="mt-2.5"
          />
          {passo.state === "current" && passo.nextLesson && (
            <span className="mt-1.5 block truncate text-sm font-bold text-sky">
              {passo.practiced === 0 ? "Comece por" : "Próxima"}: {passo.nextLesson}
            </span>
          )}
        </>
      )}
    </>
  );

  if (passo.state === "soon") {
    // Não é link: a matéria ainda não existe, e não há para onde ir.
    return <div className="min-w-0 flex-1 rounded-card border border-dashed border-ink/15 px-4 py-3 text-content-subtle">{corpo}</div>;
  }

  return (
    <Link
      href={`/materia/${passo.subject}`}
      className={`flex min-w-0 flex-1 items-center gap-2 rounded-card bg-surface-raised px-4 py-3 shadow-lift transition hover:-translate-y-0.5 ${
        passo.state === "current" ? "ring-2 ring-sky" : ""
      }`}
    >
      <span className="min-w-0 flex-1">{corpo}</span>
      <ChevronRight className="size-5 shrink-0 text-content-faint" aria-hidden="true" />
    </Link>
  );
}
