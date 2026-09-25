import { SaveOffline } from "@/components/offline/SaveOffline";
import { paginasDaMateria } from "@/lib/offline";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookA, ClipboardCheck, Crown } from "lucide-react";
import { SubjectSummary } from "@/components/trail/SubjectSummary";
import { SubjectTrail } from "@/components/trail/SubjectTrail";
import { Callout, Card } from "@/components/ui";
import { serverGet } from "@/lib/backend";
import { pluralize } from "@/lib/format";
import { concluida } from "@/lib/lesson-trail";
import type { SubjectsResponse } from "@/lib/types";
import { OUTRAS } from "@/lib/areas";

export const metadata: Metadata = { title: "Matéria" };

export default async function MateriaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { areas, subjects } = await serverGet<SubjectsResponse>("/subjects");
  const subject = subjects.find((s) => s.slug === slug);
  if (!subject) notFound();

  // Volta para a área de onde a pessoa veio; sem área conhecida, "Outras matérias".
  const area = (areas ?? []).find((a) => a.slug === subject.area) ?? OUTRAS;

  const limited = subject.lessons.some((l) => l.questions_available < l.questions_total);
  // A mesma regra da trilha: a próxima é a primeira ainda não praticada.
  const proxima = subject.lessons.find((l) => !concluida(l)) ?? null;
  const feitas = subject.lessons.filter(concluida).length;
  const simuladoLiberado = subject.exam.available && subject.exam.unlocked;
  const atalhos = (simuladoLiberado ? 1 : 0) + (subject.vocabulary_terms > 0 ? 1 : 0);

  return (
    <div className="space-y-6">
      <Link href={`/area/${area.slug}`} className="inline-flex min-h-11 items-center gap-2 text-base text-content-secondary hover:text-ink">
        <ArrowLeft className="size-5" aria-hidden="true" /> {area.name}
      </Link>

      <header>
        <h1 className="text-4xl">{subject.name}</h1>
        {subject.description && <p className="mt-3 text-base text-content-secondary">{subject.description}</p>}
      </header>

      {/* Quanto falta para a prova e quanto do caminho já andou: as duas
          perguntas que a pessoa faz ao abrir a matéria, e que a trilha
          sozinha não responde. */}
      <SubjectSummary lessons={subject.lessons} examDate={subject.exam_date} />

      {/*
        A próxima lição é a notícia da tela, e por isso é o único bloco
        escuro. Antes esse lugar era do simulado: a pessoa abria a matéria,
        o que chamava atenção era o atalho mais raro, e a lição a fazer
        estava no meio da trilha, uma tela e meia para baixo.
      */}
      {proxima && (
        <Card tone="bold" size="lg" radius="panel" href={`/licao/${proxima.id}`}>
          <p className="label-mono !text-on-bold/60">
            {feitas === 0 ? "Comece por aqui" : "Próxima lição"} · {proxima.position} de {subject.lessons.length}
          </p>
          <p className="mt-2 font-display text-2xl leading-tight font-bold">{proxima.title}</p>
          {proxima.module && <p className="mt-1 text-base on-bold-secondary">{proxima.module}</p>}
          <span className="mt-4 inline-flex items-center gap-2 font-bold text-sky">
            {feitas === 0 ? "Começar" : "Abrir a lição"} <ArrowRight className="size-5" aria-hidden="true" />
          </span>
        </Card>
      )}

      {/* Os dois atalhos da matéria lado a lado: são ferramentas, não o
          caminho, e empilhados em cartões largos empurravam a trilha para
          baixo da dobra. */}
      {(atalhos > 0 || (subject.exam.available && !subject.exam.unlocked)) && (
        <div className="space-y-3">
          {atalhos > 0 && (
            <div className={`grid gap-3 ${atalhos === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
              {simuladoLiberado && (
                <Card href={`/simulado/${subject.slug}`} size="sm" className="flex flex-col gap-3">
                  <span className="grid size-10 place-items-center rounded-control bg-coral-soft text-coral">
                    <ClipboardCheck className="size-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-base font-bold">Simulado</span>
                    <span className="block text-sm text-content-subtle">
                      {subject.exam.writing
                        ? "Um texto inteiro, do zero"
                        : `${pluralize(subject.exam.questions, "questão", "questões")} de todas as lições`}
                    </span>
                  </span>
                </Card>
              )}
              {/*
              | O vocabulário só aparece quando a matéria tem palavras — link
              | para página vazia é pior que link nenhum. A lista é montada
              | das etapas das lições, então cresce sozinha com o conteúdo.
              */}
              {subject.vocabulary_terms > 0 && (
                <Card href={`/materia/${subject.slug}/vocabulario`} size="sm" className="flex flex-col gap-3">
                  <span className="grid size-10 place-items-center rounded-control bg-sky-soft text-sky">
                    <BookA className="size-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-base font-bold">Vocabulário</span>
                    <span className="block text-sm text-content-subtle">
                      {pluralize(subject.vocabulary_terms, "palavra", "palavras")} com o significado
                    </span>
                  </span>
                </Card>
              )}
            </div>
          )}

          {subject.exam.available && !subject.exam.unlocked && (
            <Callout role="bloqueado" icon={ClipboardCheck} href="/planos">
              <strong>Simulado da matéria.</strong> Mistura questões de todas as lições — faz parte do plano Pro.
            </Callout>
          )}
        </div>
      )}

      {/* Some sozinho onde não há service worker (desenvolvimento, navegador antigo). */}
      <SaveOffline
        urls={paginasDaMateria(
          subject.slug,
          subject.lessons.map((l) => l.id),
          subject.vocabulary_terms > 0,
          area.slug,
        )}
      />

      {/* A trilha no lugar da lista: com 30 lições, uma fileira de linhas
          iguais não mostra onde você está nem quanto falta. */}
      <SubjectTrail lessons={subject.lessons} />

      {limited && (
        <Callout role="bloqueado" icon={Crown} href="/planos">
          No plano grátis cada lição traz parte das questões. <strong>Veja os planos.</strong>
        </Callout>
      )}
    </div>
  );
}
