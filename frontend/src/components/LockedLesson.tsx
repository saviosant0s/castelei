import Link from "next/link";
import { Lock, X } from "lucide-react";
import type { LessonDetail } from "@/lib/types";

/*
| A lição trancada: diz qual falta ver e leva até ela.
|
| Dentro da matéria, a lição seguinte só abre depois de ver a anterior (ler
| até o fim ou praticar). A API nem manda as etapas da trancada — esta tela é
| tudo o que chega. Duas saídas, da mais útil para a menos: ir à lição que
| falta e conhecer o Pro, que pula a ordem. O X volta à matéria.
*/
export function LockedLesson({ lesson }: { lesson: LessonDetail }) {
  const falta = lesson.locked;
  if (!falta) return null;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-4 pb-10">
      <Link
        href={`/materia/${lesson.subject.slug}`}
        aria-label={`Voltar para ${lesson.subject.name}`}
        className="grid size-11 place-items-center rounded-full text-content-secondary hover:bg-ink/5"
      >
        <X className="size-6" aria-hidden="true" />
      </Link>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <span className="grid size-16 place-items-center rounded-full bg-ink/5 text-content-secondary">
          <Lock className="size-7" aria-hidden="true" />
        </span>
        <p className="label-mono mt-5">{lesson.subject.name}</p>
        <h1 className="mt-1 text-3xl">{lesson.title}</h1>
        <p className="mt-3 text-base text-content-secondary">
          Abre quando você ler ou praticar a lição {falta.position}: {falta.title}.
        </p>
      </div>

      <div className="space-y-3">
        <Link href={`/licao/${falta.id}`} className="btn btn-primary w-full">
          Ir para a lição {falta.position}
        </Link>
        <Link href="/planos" className="btn btn-ghost w-full border-2 border-ink/15">
          Com o Pro, abra qualquer lição
        </Link>
      </div>
    </div>
  );
}
