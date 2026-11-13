"use client";

import Link from "next/link";
import { BookOpen, ChevronDown, ListChecks, X } from "lucide-react";
import { LessonVideo } from "@/components/LessonVideo";
import { dominada } from "@/components/LessonStepper";
import { LessonStudyBox } from "@/components/study/LessonStudyBox";
import { pluralize } from "@/lib/format";
import { minutosDeLeitura, palavrasDaLicao, resumoDaLicao } from "@/lib/lesson-hub";
import { useSpot } from "@/lib/lesson-progress";
import type { LessonDetail } from "@/lib/types";

/*
| A tela da lição: o que dá para fazer com ela.
|
| Pedido do Sávio, novembro de 2026. A lição era um corredor só: ler, ler,
| ler, e no fim apareciam de uma vez a questão, a dúvida, a anotação e um
| botão de voltar solto, tudo "pendurado". Agora ela abre aqui, com três
| caminhos: ler, assistir (quando há vídeo) e fazer as questões. O resto do
| que era do fim (resumo, palavras novas, dúvida e anotação) mora embaixo.
|
| A ordem SUGERE e não tranca: "Ler" leva o destaque até a pessoa ler, e
| depois o destaque passa para as questões, porque praticar logo depois de
| estudar é o que mais fixa (ver docs/principios-pedagogicos.md). O vídeo é
| um jeito a mais de estudar, mas não conta como "vista" para a trava da
| trilha: não dá para saber se alguém assistiu até o fim.
*/
export function LessonHub({ lesson }: { lesson: LessonDetail }) {
  const escrita = lesson.practice === "writing";
  const lida = lesson.read ?? false;
  const spot = useSpot(lesson.id);
  const parouEm = spot && spot.total === lesson.steps.length && spot.step > 0 ? spot.step + 1 : null;

  const minutos = minutosDeLeitura(lesson.steps);
  const resumo = resumoDaLicao(lesson.steps);
  const palavras = palavrasDaLicao(lesson.steps);

  const praticar = escrita
    ? `Escrever o texto em ${lesson.questions_available} partes`
    : `Fazer ${pluralize(lesson.questions_available, "questão", "questões")}`;

  // O botão em destaque é UM só por vez: ler antes de ler; praticar depois.
  const lerPrimeiro = !lida;

  return (
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-16 pt-4">
      <header className="flex items-center gap-2">
        <Link
          href={`/materia/${lesson.subject.slug}`}
          aria-label={`Voltar para ${lesson.subject.name}`}
          className="grid size-11 shrink-0 place-items-center rounded-full text-ink/70 hover:bg-ink/5"
        >
          <X className="size-6" aria-hidden="true" />
        </Link>
        <p className="min-w-0 truncate text-sm font-bold text-content-secondary">{lesson.subject.name}</p>
      </header>

      <h1 className="mt-6 text-3xl">{lesson.title}</h1>
      <p className="mt-3 text-base leading-relaxed text-content-secondary">{lesson.summary}</p>

      {dominada(lesson.mastery) && (
        <p className="mt-4 rounded-control bg-sage-soft px-4 py-2.5 text-sm">
          Você já domina esta lição ({lesson.mastery}%). Dá para ir direto às questões.
        </p>
      )}

      <div className="mt-7 space-y-3">
        <Link
          href={`/licao/${lesson.id}/ler`}
          className={`btn w-full justify-between px-5 ${lerPrimeiro ? "btn-primary" : "btn-ghost border-2 border-ink/15"}`}
        >
          <span className="flex items-center gap-3">
            <BookOpen className="size-5" aria-hidden="true" />
            {parouEm ? `Continuar da etapa ${parouEm}` : lida ? "Ler de novo" : "Ler a lição"}
          </span>
          <span className="text-sm font-medium opacity-80">
            {pluralize(lesson.steps.length, "etapa", "etapas")} · {minutos} min
          </span>
        </Link>

        <Link
          href={`/licao/${lesson.id}/praticar`}
          className={`btn w-full justify-between px-5 ${lerPrimeiro ? "btn-ghost border-2 border-ink/15" : "btn-primary"}`}
        >
          <span className="flex items-center gap-3">
            <ListChecks className="size-5" aria-hidden="true" />
            {praticar}
          </span>
        </Link>

        {!escrita && (lesson.wrong_count ?? 0) > 0 && (
          <p className="text-center text-sm">
            <Link href={`/licao/${lesson.id}/praticar?erradas=1`} className="font-bold text-content-secondary underline underline-offset-4">
              Refazer só as {lesson.wrong_count} que você errou
            </Link>
          </p>
        )}

        {lesson.limited_by_plan && (
          <p className="text-center text-sm text-content-secondary">
            Plano grátis: {lesson.questions_available} de {lesson.questions_total} questões.{" "}
            <Link href="/planos" className="font-bold underline underline-offset-4">
              Ver planos
            </Link>
          </p>
        )}
      </div>

      {lesson.video && (
        <section aria-labelledby="em-video" className="mt-9">
          <h2 id="em-video" className="text-xl">
            Em vídeo
          </h2>
          <p className="mt-1 text-sm text-content-secondary">
            Uma aula sobre o mesmo assunto{lesson.video.channel ? `, do canal ${lesson.video.channel}` : ""}. Abre aqui mesmo.
          </p>
          <LessonVideo video={lesson.video} />
        </section>
      )}

      {/*
      | O resumo e as palavras ficam recolhidos: são para revisar, e abertos
      | empurrariam a dúvida e a anotação para o fim de uma rolagem longa.
      | `details` funciona sem JavaScript e o leitor de tela já sabe ler.
      */}
      <div className="mt-9 divide-y divide-ink/10 border-y border-ink/10">
        {resumo && (
          <details className="group py-1">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 font-bold">
              {resumo.title}
              <ChevronDown className="size-5 shrink-0 text-content-faint transition group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="space-y-3 pb-4 text-base leading-relaxed">
              {resumo.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {resumo.bullets && (
                <ul className="list-disc space-y-1 pl-5">
                  {resumo.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          </details>
        )}
        {palavras.length > 0 && (
          <details className="group py-1">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 font-bold">
              {pluralize(palavras.length, "palavra nova", "palavras novas")}
              <ChevronDown className="size-5 shrink-0 text-content-faint transition group-open:rotate-180" aria-hidden="true" />
            </summary>
            <dl className="divide-y divide-ink/10 pb-3">
              {palavras.map((t) => (
                <div key={t.word} className="py-2">
                  <dt className="inline font-bold">{t.word}: </dt>
                  <dd className="inline text-base leading-relaxed">{t.meaning}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}
      </div>

      {/* A dúvida e a anotação: saíram do fim da leitura, onde ficavam penduradas. */}
      <LessonStudyBox lessonId={lesson.id} />
    </div>
  );
}
