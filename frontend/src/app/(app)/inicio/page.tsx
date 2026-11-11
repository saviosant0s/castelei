import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight, CloudUpload } from "lucide-react";
import { Card, PageHero } from "@/components/ui";
import { HomeGoal } from "@/components/app/HomeGoal";
import { AreaTile } from "@/components/home/AreaTile";
import { TrailCard } from "@/components/home/TrailCard";
import { areaIcon, areaProgress, groupByArea } from "@/lib/areas";
import { currentStep, startedFirst, trailView } from "@/lib/trails";
import { serverGet } from "@/lib/backend";
import { firstName, pluralize } from "@/lib/format";
import type { AppBarResponse, ProgressResponse, SubjectsResponse, User } from "@/lib/types";

export const metadata: Metadata = { title: "Início" };

/** A frase embaixo do "Oi": o que o streak pede hoje, sem cobrar. */
function saudacao(gami: ProgressResponse["gamification"]): string {
  if (!gami) return "Escolha uma área e comece por onde quiser.";
  const dias = gami.streak.current;
  if (gami.streak.studied_today) {
    return dias > 1 ? `${dias} dias seguidos. Hoje já está feito.` : "Hoje já está feito. Volte amanhã para começar uma sequência.";
  }
  if (dias > 0) return `Estude hoje para chegar a ${dias + 1} dias seguidos.`;
  return "Uma lição por dia já começa uma sequência.";
}

/** Embaixo do "Oi", com meta: quanto falta hoje, ou a comemoração. */
function fraseDaMeta(meta: { today: number; target: number }, gami: ProgressResponse["gamification"]): string {
  const falta = meta.target - meta.today;
  if (falta <= 0) {
    const dias = gami?.streak.current ?? 0;
    return dias > 1 ? `Meta de hoje feita. São ${dias} dias seguidos.` : "Meta de hoje feita. Volte amanhã para manter o ritmo.";
  }
  if (meta.today === 0) return `Sua meta é ${meta.target} XP por dia. Cada acerto vale 20.`;
  return `Faltam ${falta} XP para a meta de hoje.`;
}

export default async function Inicio() {
  const [{ user }, { areas, subjects, trails }, progress, bar] = await Promise.all([
    serverGet<{ user: User }>("/me"),
    serverGet<SubjectsResponse>("/subjects"),
    serverGet<ProgressResponse>("/progress"),
    // A meta do dia é o extra: falhou, a tela abre sem o anel.
    serverGet<AppBarResponse>("/me/bar").catch(() => null),
  ]);
  const meta = bar?.gamification?.goal ?? null;

  const last = progress.last_attempt;
  const gami = progress.gamification;
  const firstLesson = subjects[0]?.lessons[0];
  const { ativas, emBreve } = groupByArea(areas ?? [], subjects);
  const trilhas = startedFirst(
    (trails ?? []).map((trail) => {
      const passos = trailView(trail, subjects);
      return { trail, passos, atual: currentStep(passos), feitos: passos.filter((p) => p.state === "done").length };
    }),
  );

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
    <div className="space-y-8">
      {/*
        A saudação fica sozinha e no centro: os dias seguidos e o XP subiram
        para o cabeçalho fixo (e aparecem em toda tela), a revisão virou aba e
        a busca mora no Perfil. A frase de baixo é a única coisa que muda de
        um dia para o outro, e diz o que fazer agora.
      */}
      <PageHero
        eyebrow="Bora estudar"
        title={`Oi, ${firstName(user.name)}!`}
        art={
          meta && (
            <HomeGoal goal={meta} />
          )
        }
      >
        {meta ? fraseDaMeta(meta, gami) : saudacao(gami)}
      </PageHero>

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
            <p className="label-mono !text-sky">Continue de onde parou</p>
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
            <p className="label-mono !text-sky">Comece por aqui</p>
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
        A ordem mudou em novembro de 2026 (pedido do Sávio): as trilhas vinham
        antes das áreas, numa lista, e com seis delas o catálogo começava na
        segunda tela — quem não rolasse não sabia que havia Física ou Artes.
        Agora as áreas vêm logo depois do "continue", numa grade que cabe numa
        tela, e as trilhas numa faixa só, de lado. A área é o caminho de todo
        dia; a trilha responde "por onde eu começo?" e aparece inteira sem
        precisar de mais espaço quando chegarem outras.
      */}
      <section aria-labelledby="areas">
        <h2 id="areas" className="text-2xl">Áreas</h2>
        <ul className="mt-4 grid grid-cols-2 gap-2.5">
          {ativas.map((area, i) => {
            const { practiced, total } = areaProgress(area.subjects);
            return (
              <li key={area.slug}>
                <AreaTile
                  href={`/area/${area.slug}`}
                  name={area.name}
                  icon={areaIcon(area.slug)}
                  index={i}
                  practiced={practiced}
                  total={total}
                />
              </li>
            );
          })}
        </ul>
      </section>

      {trilhas.length > 0 && (
        <section aria-labelledby="trilhas">
          <h2 id="trilhas" className="text-2xl">{trilhas.length > 1 ? "Trilhas de estudo" : "Trilha de estudo"}</h2>
          {/*
            Rola de lado e sangra até a borda da tela (-mx-5), para o cartão
            seguinte aparecer cortado: é o que avisa que tem mais. O pb-3 é a
            folga da sombra, que a caixa de rolagem cortaria embaixo.
          */}
          <ul className="-mx-5 mt-4 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {trilhas.map(({ trail, passos, atual, feitos }) => (
              <li key={trail.slug} className={`shrink-0 snap-start ${trilhas.length > 1 ? "w-[16.5rem]" : "w-full"}`}>
                <TrailCard
                  href={`/trilha/${trail.slug}`}
                  name={trail.name}
                  detail={
                    (trail.private ? "Só você vê · " : "") +
                    (atual ? `Passo ${atual.number} de ${passos.length}: ${atual.name}` : "Todos os passos disponíveis concluídos")
                  }
                  done={feitos}
                  total={passos.length}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

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
