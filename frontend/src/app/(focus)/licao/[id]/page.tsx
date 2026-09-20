import type { Metadata } from "next";
import { LessonStepper } from "@/components/LessonStepper";
import { serverGet } from "@/lib/backend";
import type { LessonDetail } from "@/lib/types";

export const metadata: Metadata = { title: "Lição" };

export default async function LicaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { lesson } = await serverGet<{ lesson: LessonDetail }>(`/lessons/${encodeURIComponent(id)}`);

  return <LessonStepper lesson={lesson} />;
}
