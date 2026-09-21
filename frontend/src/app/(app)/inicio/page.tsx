import type { Metadata } from "next";
import { ArrowRight, BookOpen, Calculator, Cpu, Flame, Languages, Star } from "lucide-react";
import { Card, type CardTone, Pill, ProgressBar } from "@/components/ui";
import { serverGet } from "@/lib/backend";
import { firstName, formatNumber, pluralize } from "@/lib/format";
import type { ProgressResponse, Subject, User } from "@/lib/types";

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
  const [{ user }, { subjects }, progress] = await Promise.all([
    serverGet<{ user: User }>("/me"),
    serverGet<{ subjects: Subject[] }>("/subjects"),
    serverGet<ProgressResponse>("/progress"),
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
