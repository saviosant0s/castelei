import type { Metadata } from "next";
import { PracticeClient } from "@/components/PracticeClient";
import { serverGet } from "@/lib/backend";
import type { LessonDetail } from "@/lib/types";

export const metadata: Metadata = { title: "Praticar" };

export default async function PraticarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { lesson } = await serverGet<{ lesson: LessonDetail }>(`/lessons/${encodeURIComponent(id)}`);

  return <PracticeClient lessonId={lesson.id} lessonTitle={lesson.title} />;
}
