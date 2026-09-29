import type { Subject, Trail, TrailStep } from "./types";

/*
| Trilha de estudo: a ordem das matérias para um objetivo.
|
| A ordem vem do backend (config/castelei.php → trails). Aqui só se cruza
| cada passo com as matérias que a pessoa tem, para dizer onde ela está.
| Mesmo critério de "praticada" das outras telas: tentativa concluída, sem
| cobrar nota.
*/

export type StepState = "done" | "current" | "open" | "soon";

export interface TrailStepView extends TrailStep {
  number: number;
  state: StepState;
  practiced: number;
  total: number;
  /** Primeira lição ainda não praticada da matéria, para o "próxima". */
  nextLesson: string | null;
}

export function trailView(trail: Trail, subjects: Subject[]): TrailStepView[] {
  const bySlug = new Map(subjects.map((s) => [s.slug, s]));
  let achouAtual = false;

  return trail.steps.map((step, i) => {
    const subject = bySlug.get(step.subject);
    if (!subject) {
      return { ...step, number: i + 1, state: "soon", practiced: 0, total: 0, nextLesson: null };
    }

    const total = subject.lessons.length;
    const practiced = subject.lessons.filter((l) => l.attempts > 0).length;
    const next = subject.lessons.find((l) => l.attempts === 0)?.title ?? null;
    const done = total > 0 && practiced === total;

    let state: StepState = done ? "done" : "open";
    if (!done && !achouAtual) {
      state = "current";
      achouAtual = true;
    }

    return { ...step, name: subject.name, number: i + 1, state, practiced, total, nextLesson: next };
  });
}

/** O passo em que a pessoa está: o primeiro que existe e ainda não terminou. */
export function currentStep(view: TrailStepView[]): TrailStepView | null {
  return view.find((s) => s.state === "current") ?? null;
}

/** Em que passo da trilha uma matéria está, se estiver. */
export function stepOfSubject(trails: Trail[], slug: string): { trail: Trail; number: number } | null {
  for (const trail of trails) {
    const i = trail.steps.findIndex((s) => s.subject === slug);
    if (i >= 0) return { trail, number: i + 1 };
  }
  return null;
}
