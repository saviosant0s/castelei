import type { Metadata } from "next";
import { LessonStepper } from "@/components/LessonStepper";
import { LockedLesson } from "@/components/LockedLesson";
import { serverGet } from "@/lib/backend";
import type { LessonDetail } from "@/lib/types";

export const metadata: Metadata = { title: "Lição" };

/** A leitura da lição, uma etapa por tela. Sai e termina na tela da lição. */
export default async function LerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { lesson } = await serverGet<{ lesson: LessonDetail }>(`/lessons/${encodeURIComponent(id)}`);

  // Trancada até ver a anterior: a API não manda as etapas, só o que falta.
  if (lesson.locked) return <LockedLesson lesson={lesson} />;

  return <LessonStepper lesson={lesson} />;
}
