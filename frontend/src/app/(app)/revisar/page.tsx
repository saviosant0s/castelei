import type { Metadata } from "next";
import { CalendarCheck, Info } from "lucide-react";
import { Callout, EmptyState } from "@/components/ui";
import { ReviewList } from "@/components/review/ReviewRow";
import { serverGet } from "@/lib/backend";
import { COMO_FUNCIONA, porQueAgora, quandoVence, resumoDaProva, tituloDaFila } from "@/lib/review";
import type { ReviewResponse } from "@/lib/types";

export const metadata: Metadata = { title: "Revisar" };

export default async function Revisar() {
  const { due, next } = await serverGet<ReviewResponse>("/review");

  if (due.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={CalendarCheck}
          title="Nada para revisar hoje"
          description={
            next
              ? `Sua próxima revisão é "${next.lesson_title}", ${quandoVence(next.days_late).toLowerCase()}. ${COMO_FUNCIONA}`
              : "Assim que você terminar uma lição, ela entra na fila de revisão e volta na hora certa."
          }
          action={{ label: "Ver matérias", href: "/inicio" }}
        />
        {next && (
          <Callout icon={Info}>
            <p>{porQueAgora(next)}</p>
          </Callout>
        )}
      </div>
    );
  }

  const prazo = resumoDaProva(due);

  return (
    <div className="space-y-8">
      <header>
        <p className="label-mono">Revisão</p>
        <h1 className="mt-1 text-4xl">{tituloDaFila(due.length)}</h1>
        <p className="mt-3 text-base text-content-secondary">{COMO_FUNCIONA}</p>
      </header>

      <section aria-labelledby="fila">
        <h2 id="fila" className="sr-only">Lições para revisar</h2>
        <ReviewList itens={due} />
      </section>

      {/*
        O prazo vem DEPOIS da lista, e só uma vez. Antes dela, viraria um
        parágrafo entre a pessoa e o que ela veio fazer. E fala da PROVA, não
        de uma lição: cada uma da fila tem seu próprio intervalo, então
        "esta lição volta a cada 5 dias" seria falso para as outras três.
      */}
      {prazo && (
        <Callout icon={Info}>
          <p>{prazo}</p>
        </Callout>
      )}
    </div>
  );
}
