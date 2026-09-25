import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, ChevronRight, CloudUpload, Calculator, Cpu, Flame, Languages, PenLine, Server, Star, Wrench } from "lucide-react";
import { Card, Pill, ProgressBar } from "@/components/ui";
import { serverGet } from "@/lib/backend";
import { firstName, formatNumber, pluralize } from "@/lib/format";
import { ReviewBell } from "@/components/review/ReviewBell";
import type { ProgressResponse, ReviewResponse, Subject, User } from "@/lib/types";

export const metadata: Metadata = { title: "Início" };

const subjectIcons: Record<string, typeof BookOpen> = {
  "matematica-basica": Calculator,
  portugues: Languages,
  "sistemas-operacionais": Cpu,
  "servidores-vps": Server,
  refatoracao: Wrench,
  "producao-textual": PenLine,
};

// O ícone de cada matéria gira entre as três cores da marca, pela ordem —
// nunca vermelho, que no Castelei quer dizer erro.
const subjectTones = ["bg-sky-soft text-sky", "bg-coral-soft text-coral", "bg-sage-soft text-sage"];

export default async function Inicio() {
  const [{ user }, { subjects }, progress, revisao] = await Promise.all([
    serverGet<{ user: User }>("/me"),
    serverGet<{ subjects: Subject[] }>("/subjects"),
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
        As matérias são uma LISTA, não uma grade de cartões.
        Eram cartões altos em duas colunas, com o ícone no topo e o nome
        embaixo — e um vão vazio no meio de cada um. Com duas matérias isso
        era vitrine; com seis, virou uma rolagem de três telas para achar a
        que se quer. A linha mostra o que a pessoa procura aqui: o nome, quanto
        falta e qual é a próxima lição daquela matéria.
      */}
      <section aria-labelledby="materias">
        <h2 id="materias" className="text-2xl">Matérias</h2>
        <ul className="mt-4 space-y-3">
          {subjects.map((subject, i) => {
            const Icon = subjectIcons[subject.slug] ?? BookOpen;
            const total = subject.lessons.length;
            const practiced = subject.lessons.filter((lesson) => lesson.attempts > 0).length;
            const proxima = subject.lessons.find((lesson) => lesson.attempts === 0);
            const tom = subjectTones[i % subjectTones.length];

            return (
              <li key={subject.id}>
                <Link
                  href={`/materia/${subject.slug}`}
                  className="flex items-center gap-4 rounded-card bg-surface-raised px-4 py-4 shadow-lift transition hover:-translate-y-0.5"
                >
                  <span className={`grid size-12 shrink-0 place-items-center rounded-control ${tom}`}>
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      {/* O nome quebra linha em vez de cortar: "Sistemas Operaci…" não diz qual matéria é. */}
                      <span className="min-w-0 font-display text-lg leading-snug font-bold">{subject.name}</span>
                      {/*
                        A barra mede lições praticadas, não acerto médio: aqui a
                        pergunta é "quanto falta". O número vem escrito — barra
                        sozinha obriga a medir a olho.
                      */}
                      <span className="shrink-0 pt-0.5 font-mono text-sm tabular-nums text-content-subtle">
                        {practiced}/{total}
                      </span>
                    </span>
                    <ProgressBar
                      percent={total > 0 ? (practiced / total) * 100 : 0}
                      tone="ink"
                      size="sm"
                      label={`${subject.name}: ${practiced} de ${total} lições praticadas`}
                      className="mt-2"
                    />
                    <span className="mt-1.5 block truncate text-sm text-content-secondary">
                      {proxima
                        ? `${practiced === 0 ? "Comece por" : "Próxima"}: ${proxima.title}`
                        : "Todas as lições praticadas"}
                    </span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-content-faint" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
