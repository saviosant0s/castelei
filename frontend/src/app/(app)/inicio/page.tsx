import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Calculator, Flame, Languages, Star } from "lucide-react";
import { serverGet } from "@/lib/backend";
import { firstName, formatNumber, pluralize } from "@/lib/format";
import type { ProgressResponse, Subject, User } from "@/lib/types";

export const metadata: Metadata = { title: "Início" };

const subjectIcons: Record<string, typeof BookOpen> = {
  "matematica-basica": Calculator,
  portugues: Languages,
};

export default async function Inicio() {
  const [{ user }, { subjects }, progress] = await Promise.all([
    serverGet<{ user: User }>("/me"),
    serverGet<{ subjects: Subject[] }>("/subjects"),
    serverGet<ProgressResponse>("/progress"),
  ]);

  const last = progress.last_attempt;
  const gami = progress.gamification;
  const firstLesson = subjects[0]?.lessons[0];

  return (
    <div className="space-y-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="label-mono">Bora estudar</p>
          <h1 className="mt-1 text-4xl">Oi, {firstName(user.name)}!</h1>
          {gami && (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-coral-soft px-3 py-1.5 font-mono text-sm font-medium"
                  aria-label={`Streak: ${gami.streak.current} ${gami.streak.current === 1 ? "dia seguido" : "dias seguidos"}`}
                >
                  <Flame className="size-4 text-coral" aria-hidden="true" /> {gami.streak.current} {gami.streak.current === 1 ? "dia" : "dias"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-soft px-3 py-1.5 font-mono text-sm font-medium" aria-label={`${gami.xp_total} pontos de experiência`}>
                  <Star className="size-4" aria-hidden="true" /> {formatNumber(gami.xp_total)} XP
                </span>
              </div>
              {gami.streak.current > 0 && !gami.streak.studied_today && (
                <p className="mt-2 text-sm text-ink/70">Estude hoje para manter seu streak.</p>
              )}
            </>
          )}
        </div>
        <Link href="/planos" className="mt-1 rounded-full bg-sky-soft px-3.5 py-1.5 font-mono text-sm font-medium">
          {user.plan_label}
        </Link>
      </header>

      <section aria-labelledby="continue">
        <h2 id="continue" className="sr-only">Continuar</h2>
        {last ? (
          <Link href={`/licao/${last.lesson_id}`} className="block rounded-3xl bg-ink p-6 text-paper shadow-lift transition hover:-translate-y-0.5">
            <p className="label-mono !text-paper/60">Continue de onde parou</p>
            <p className="mt-3 font-display text-2xl font-bold">{last.lesson_title}</p>
            <p className="mt-1 text-base text-paper/70">
              {last.subject_name}
              {last.percent !== null ? ` · último resultado ${last.percent}%` : " · você não terminou a última prática"}
            </p>
            <span className="mt-5 inline-flex items-center gap-2 font-bold text-sky">
              Abrir lição <ArrowRight className="size-5" aria-hidden="true" />
            </span>
          </Link>
        ) : firstLesson ? (
          <Link href={`/licao/${firstLesson.id}`} className="block rounded-3xl bg-ink p-6 text-paper shadow-lift transition hover:-translate-y-0.5">
            <p className="label-mono !text-paper/60">Comece por aqui</p>
            <p className="mt-3 font-display text-2xl font-bold">{firstLesson.title}</p>
            <p className="mt-1 text-base text-paper/70">Leva poucos minutos: leia a lição e treine {pluralize(firstLesson.questions_available, "questão", "questões")}.</p>
            <span className="mt-5 inline-flex items-center gap-2 font-bold text-sky">
              Começar <ArrowRight className="size-5" aria-hidden="true" />
            </span>
          </Link>
        ) : null}
      </section>

      <section aria-labelledby="materias">
        <h2 id="materias" className="text-2xl">Matérias</h2>
        <ul className="mt-4 grid grid-cols-2 gap-4">
          {subjects.map((subject, i) => {
            const Icon = subjectIcons[subject.slug] ?? BookOpen;
            return (
              <li key={subject.id} className={i % 2 === 1 ? "mt-8" : ""}>
                <Link
                  href={`/materia/${subject.slug}`}
                  className={`flex h-full min-h-44 flex-col justify-between rounded-3xl p-5 transition hover:-translate-y-0.5 ${i % 2 === 0 ? "bg-sky-soft" : "bg-coral-soft"}`}
                >
                  <Icon className="size-8" aria-hidden="true" />
                  <div>
                    <p className="font-display text-2xl font-bold leading-tight">{subject.name}</p>
                    <p className="mt-1 text-sm text-ink/70">{pluralize(subject.lessons.length, "lição", "lições")}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
