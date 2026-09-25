import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight, CloudUpload, Flame, Search, Star } from "lucide-react";
import { Card, Pill } from "@/components/ui";
import { SubjectRow, tones } from "@/components/home/SubjectRow";
import { areaIcon, areaProgress, groupByArea } from "@/lib/areas";
import { serverGet } from "@/lib/backend";
import { firstName, formatNumber, pluralize } from "@/lib/format";
import { ReviewBell } from "@/components/review/ReviewBell";
import type { ProgressResponse, ReviewResponse, SubjectsResponse, User } from "@/lib/types";

export const metadata: Metadata = { title: "Início" };

export default async function Inicio() {
  const [{ user }, { areas, subjects }, progress, revisao] = await Promise.all([
    serverGet<{ user: User }>("/me"),
    serverGet<SubjectsResponse>("/subjects"),
    serverGet<ProgressResponse>("/progress"),
    /*
      A fila de revisão nunca pode derrubar a tela inicial: ela é o extra, e
      as matérias são o essencial. Falhou, o sininho abre sem número.
    */
    serverGet<ReviewResponse>("/review").catch(() => ({ due: [], next: null }) as ReviewResponse),
  ]);

  const last = progress.last_attempt;
  const gami = progress.gamification;
  const firstLesson = subjects[0]?.lessons[0];
  const { ativas, emBreve } = groupByArea(areas ?? [], subjects);

  /*
  | O simulado atravessa várias lições, então não tem `lesson_id` — quem volta
  | dele vai para a matéria. Montar `/licao/${lesson_id}` às cegas gerava
  | "/licao/null" e derrubava a tela com erro 500.
  */
  const continueHref = last
    ? last.lesson_id !== null
      ? `/licao/${last.lesson_id}`
      : last.subject_slug !== null
        ? `/materia/${last.subject_slug}`
        : null
    : null;

  return (
    <div className="space-y-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="label-mono">Bora estudar</p>
          <h1 className="mt-1 text-4xl">Oi, {firstName(user.name)}!</h1>
          {gami && (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Pill
                  tone="coral"
                  icon={Flame}
                  label={`Streak: ${gami.streak.current} ${gami.streak.current === 1 ? "dia seguido" : "dias seguidos"}`}
                >
                  {gami.streak.current} {gami.streak.current === 1 ? "dia" : "dias"}
                </Pill>
                <Pill tone="sky" icon={Star} label={`${gami.xp_total} pontos de experiência`}>
                  {formatNumber(gami.xp_total)} XP
                </Pill>
              </div>
              {gami.streak.current > 0 && !gami.streak.studied_today && (
                <p className="mt-2 text-sm text-content-secondary">Estude hoje para manter seu streak.</p>
              )}
            </>
          )}
        </div>
        {/* A fila de revisão mora em /revisar; aqui fica só o aviso, no sininho. */}
        <div className="flex shrink-0 items-center gap-2">
          <Pill tone="sky" href="/planos">
            {user.plan_label}
          </Pill>
          <Link
            href="/buscar"
            aria-label="Buscar lição, palavra ou anotação"
            className="grid size-11 shrink-0 place-items-center rounded-pill bg-surface-raised text-content shadow-lift transition hover:-translate-y-0.5"
          >
            <Search className="size-5" aria-hidden="true" />
          </Link>
          <ReviewBell vencidas={revisao.due.length} />
        </div>
      </header>

      {/*
        Só para visitante que JÁ estudou alguma coisa: antes disso não há o que
        perder, e o convite seria só mais um cartão no caminho.
      */}
      {user.is_guest && last && (
        <Link
          href="/cadastro"
          className="flex items-center gap-3 rounded-card border-2 border-dashed border-sage/60 bg-sage-soft/50 px-4 py-3 text-base"
        >
          <CloudUpload className="size-5 shrink-0 text-sage" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <strong>Crie sua conta</strong> para não perder o que já estudou neste navegador.
          </span>
          <ChevronRight className="size-5 shrink-0 text-content-faint" aria-hidden="true" />
        </Link>
      )}

      <section aria-labelledby="continue">
        <h2 id="continue" className="sr-only">Continuar</h2>
        {last && continueHref ? (
          <Card tone="bold" size="lg" radius="panel" href={continueHref}>
            <p className="label-mono !text-on-bold/60">Continue de onde parou</p>
            <p className="mt-3 font-display text-2xl font-bold">{last.lesson_title}</p>
            <p className="mt-1 text-base on-bold-secondary">
              {last.subject_name}
              {last.percent !== null ? ` · último resultado ${last.percent}%` : " · você não terminou a última prática"}
            </p>
            <span className="mt-5 inline-flex items-center gap-2 font-bold text-sky">
              {last.kind === "exam" ? "Abrir matéria" : "Abrir lição"}{" "}
              <ArrowRight className="size-5" aria-hidden="true" />
            </span>
          </Card>
        ) : firstLesson ? (
          <Card tone="bold" size="lg" radius="panel" href={`/licao/${firstLesson.id}`}>
            <p className="label-mono !text-on-bold/60">Comece por aqui</p>
            <p className="mt-3 font-display text-2xl font-bold">{firstLesson.title}</p>
            <p className="mt-1 text-base on-bold-secondary">
              Leva poucos minutos: leia a lição e treine {pluralize(firstLesson.questions_available, "questão", "questões")}.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 font-bold text-sky">
              Começar <ArrowRight className="size-5" aria-hidden="true" />
            </span>
          </Card>
        ) : null}
      </section>

      {/*
        A porta de entrada é a ÁREA, não a matéria: Sistemas Operacionais é uma
        disciplina de Informática. Primeiro as áreas que já têm aula; as outras
        vêm depois, apagadas, com "Em breve" — para a pessoa ver o que o app
        vai cobrir sem ter que tocar numa porta fechada para descobrir.
      */}
      <section aria-labelledby="areas">
        <h2 id="areas" className="text-2xl">Áreas</h2>
        <ul className="mt-4 space-y-3">
          {ativas.map((area, i) => {
            const { practiced, total } = areaProgress(area.subjects);
            return (
              <li key={area.slug}>
                <SubjectRow
                  href={`/area/${area.slug}`}
                  name={area.name}
                  icon={areaIcon(area.slug)}
                  tone={tones[i % tones.length]}
                  practiced={practiced}
                  total={total}
                  detail={area.subjects.map((subject) => subject.name).join(" · ")}
                />
              </li>
            );
          })}
        </ul>
      </section>

      {emBreve.length > 0 && (
        <section aria-labelledby="em-breve">
          <h2 id="em-breve" className="text-2xl">Em breve</h2>
          <p className="mt-1 text-base text-content-secondary">Áreas que ainda não têm aula por aqui.</p>
          {/*
            Não são links, de propósito: não há para onde ir, e alvo que
            responde ao toque sem levar a lugar nenhum frustra. Por isso também
            não têm sombra nem seta — nada nelas diz "toque aqui".
          */}
          <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {emBreve.map((area) => {
              const Icon = areaIcon(area.slug);
              return (
                <li
                  key={area.slug}
                  className="flex flex-col items-center gap-1.5 rounded-card border border-ink/10 px-2 py-3 text-center text-content-subtle"
                >
                  <Icon className="size-6 text-content-faint" aria-hidden="true" />
                  <span className="text-sm leading-tight font-bold">{area.name}</span>
                  <span className="sr-only">: em breve</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
