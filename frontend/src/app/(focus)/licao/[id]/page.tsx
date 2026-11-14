import type { Metadata } from "next";
import { LessonHub } from "@/components/lesson/LessonHub";
import { LockedLesson } from "@/components/LockedLesson";
import { serverGet } from "@/lib/backend";
import type { LessonDetail } from "@/lib/types";

export const metadata: Metadata = { title: "Lição" };

export default async function LicaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { lesson } = await serverGet<{ lesson: LessonDetail }>(`/lessons/${encodeURIComponent(id)}`);

  // Trancada até ver a anterior: a API não manda as etapas, só o que falta.
  if (lesson.locked) return <LockedLesson lesson={lesson} />;

  // A tela da lição: ler, assistir ou fazer as questões. A leitura mora em /ler.
  return <LessonHub lesson={lesson} />;
}
