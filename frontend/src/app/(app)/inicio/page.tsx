import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Calculator, Cpu, Flame, Languages, RotateCcw, Star } from "lucide-react";
import { Card, type CardTone, Pill, ProgressBar } from "@/components/ui";
import { serverGet } from "@/lib/backend";
import { firstName, formatNumber, pluralize } from "@/lib/format";
import { ReviewList } from "@/components/review/ReviewRow";
import { COMO_FUNCIONA, tituloDaFila } from "@/lib/review";
import type { ProgressResponse, ReviewResponse, Subject, User } from "@/lib/types";

export const metadata: Metadata = { title: "Início" };

const subjectIcons: Record<string, typeof BookOpen> = {
  "matematica-basica": Calculator,
  portugues: Languages,
  "sistemas-operacionais": Cpu,
};

// As matérias alternam entre céu e coral, e a coluna da direita desce um degrau:
// grade assimétrica foge da fileira de cartões iguais (ver anti-padrões do plano).
const subjectTones: CardTone[] = ["sky", "coral"];

export default async function Inicio() {
  const [{ user }, { subjects }, progress, revisao] = await Promise.all([
    serverGet<{ user: User }>("/me"),
    serverGet<{ subjects: Subject[] }>("/subjects"),
    serverGet<ProgressResponse>("/progress"),
    /*
      A fila de revisão nunca pode derrubar a tela inicial: ela é o extra, e
      as matérias são o essencial. Falhou, a tela abre sem o bloco.
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
        <Pill tone="sky" href="/planos">
          {user.plan_label}
        </Pill>
      </header>

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
        O bloco que responde "o que eu estudo hoje?".
        Fica ACIMA das matérias de propósito: quem abre o app sem plano cai na
        grade de matérias e escolhe no chute. A revisão é a única parte do app
        que tem opinião sobre isso, e opinião escondida embaixo da dobra não
        vale nada.
        Só aparece quando há algo vencido — bloco vazio todo dia vira ruído,
        e o lugar de "está tudo em dia" é a tela de revisão, não esta.
      */}
      {revisao.due.length > 0 && (
        <section aria-labelledby="revisar">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="revisar" className="flex items-center gap-2 text-2xl">
              <RotateCcw className="size-5 text-sky" aria-hidden="true" />
              {tituloDaFila(revisao.due.length)}
            </h2>
            {revisao.due.length > 3 && (
              <Link href="/revisar" className="shrink-0 text-base font-bold text-sky">
                Ver todas
              </Link>
            )}
          </div>
          <p className="mt-1 text-sm text-content-secondary">{COMO_FUNCIONA}</p>
          <div className="mt-4">
            <ReviewList itens={revisao.due} limite={3} />
          </div>
        </section>
      )}

      <section aria-labelledby="materias">
        <h2 id="materias" className="text-2xl">Matérias</h2>
        <ul className="mt-4 grid grid-cols-2 gap-4">
          {subjects.map((subject, i) => {
            const Icon = subjectIcons[subject.slug] ?? BookOpen;
            const total = subject.lessons.length;
            const practiced = subject.lessons.filter((lesson) => lesson.attempts > 0).length;

            return (
              <li key={subject.id} className={i % 2 === 1 ? "mt-8" : ""}>
                <Card
                  href={`/materia/${subject.slug}`}
                  tone={subjectTones[i % 2]}
                  radius="panel"
                  className="flex h-full min-h-44 min-w-0 flex-col justify-between"
                >
                  <Icon className="size-8" aria-hidden="true" />
                  <div className="min-w-0">
                    {/*
                      "Operacionais" sozinha não cabe em meia tela de celular a 24px:
                      o nome vazava do cartão. O tamanho acompanha a largura da tela
                      e `break-words` é a rede de segurança para nomes ainda maiores.
                    */}
                    <p className="font-display text-[clamp(1rem,4.2vw,1.375rem)] font-bold leading-tight break-words">
                      {subject.name}
                    </p>
                    {/*
                      A barra mede lições praticadas, não acerto médio: na
                      tela inicial a pergunta é "quanto falta", e nota média
                      misturada com avanço não responde nenhuma das duas.
                      O número vem escrito — barra sozinha obriga a medir a
                      olho e some para quem enxerga pouco.
                    */}
                    <p className="mt-1 text-sm text-content-secondary">
                      {practiced} de {pluralize(subject.lessons.length, "lição", "lições")}
                    </p>
                    <ProgressBar
                      percent={total > 0 ? (practiced / total) * 100 : 0}
                      tone="ink"
                      size="sm"
                      label={`${subject.name}: ${practiced} de ${total} lições praticadas`}
                      className="mt-2"
                    />
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
