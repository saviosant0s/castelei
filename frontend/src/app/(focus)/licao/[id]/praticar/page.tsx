import type { Metadata } from "next";
import { PracticeClient } from "@/components/PracticeClient";
import { serverGet } from "@/lib/backend";
import type { LessonDetail } from "@/lib/types";

export const metadata: Metadata = { title: "Praticar" };

export default async function PraticarPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erradas?: string }>;
}) {
  const { id } = await params;
  // `?erradas=1`: só as questões cuja última resposta foi errada.
  const onlyWrong = (await searchParams).erradas === "1";
  const { lesson } = await serverGet<{ lesson: LessonDetail }>(`/lessons/${encodeURIComponent(id)}`);

  return (
    <PracticeClient
      // A chave troca a prática inteira quando se passa de "todas" para "as que errei" na mesma rota.
      key={onlyWrong ? "erradas" : "todas"}
      source={{ kind: "lesson", lessonId: lesson.id, lessonTitle: lesson.title, onlyWrong }}
    />
  );
}
