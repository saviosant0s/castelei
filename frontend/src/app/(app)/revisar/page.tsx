import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, CalendarClock, Info } from "lucide-react";
import { Callout, Card, EmptyState } from "@/components/ui";
import { ReviewList } from "@/components/review/ReviewRow";
import { serverGet } from "@/lib/backend";
import { COMO_FUNCIONA, porQueAgora, quandoVence, resumoDaProva, tituloDaFila } from "@/lib/review";
import type { ReviewResponse } from "@/lib/types";

export const metadata: Metadata = { title: "Revisar" };

export default async function Revisar() {
  const { due, next } = await serverGet<ReviewResponse>("/review");

  /*
    Fila vazia NÃO é tela vazia. A pessoa acabou de revisar tudo, ou ainda
    não terminou lição nenhuma — nos dois casos, o cabeçalho continua o
    mesmo da fila cheia, para a tela não mudar de cara entre um dia e outro.
    Quando já existe uma revisão marcada, ela vira a notícia: "o que vem, e
    quando" responde melhor que um parágrafo explicando o método.
  */
  if (due.length === 0) {
    return (
      <div className="space-y-8">
        <header>
          <p className="label-mono">Revisão</p>
          <h1 className="mt-1 text-4xl">{next ? "Tudo em dia" : "Nada para revisar"}</h1>
        </header>

        {next ? (
          <>
            <section aria-labelledby="proxima" className="space-y-3">
              <h2 id="proxima" className="label-mono px-1">
                Próxima revisão
              </h2>
              <Card size="lg" className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-control bg-sky-soft text-sky">
                  <CalendarClock className="size-6" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-xl font-bold">{next.lesson_title}</span>
                  {next.subject_name && <span className="block text-sm text-content-subtle">{next.subject_name}</span>}
                  <span className="mt-3 inline-block rounded-pill bg-sky-soft px-3 py-1 text-sm font-bold">
                    {quandoVence(next.days_late)}
                  </span>
                  <span className="mt-3 block text-base text-content-secondary">{porQueAgora(next)}</span>
                </span>
              </Card>
            </section>
            <p className="text-sm text-content-subtle">{COMO_FUNCIONA}</p>
            <Link href="/inicio" className="btn btn-primary w-full">
              Estudar uma lição nova
            </Link>
          </>
        ) : (
          <EmptyState
            level="h2"
            icon={CalendarCheck}
            title="A fila começa na primeira lição"
            description="Assim que você terminar uma lição, ela entra na fila de revisão e volta na hora certa."
            action={{ label: "Ver matérias", href: "/inicio" }}
          />
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
