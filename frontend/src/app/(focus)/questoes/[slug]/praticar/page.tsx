import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PracticeClient } from "@/components/PracticeClient";
import { serverGet } from "@/lib/backend";
import type { Difficulty, SubjectsResponse } from "@/lib/types";

export const metadata: Metadata = { title: "Questões" };

/*
| Uma rodada da aba Questões: questões sorteadas da matéria inteira, e não
| de uma lição só (pedido do Sávio: de oito em oito, o app parecia ter pouca
| coisa). `?nivel=` escolhe o nível, que é do Pro; o servidor confere.
*/
export default async function RodadaDaMateria({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ nivel?: string }>;
}) {
  const [{ slug }, { nivel }] = await Promise.all([params, searchParams]);
  const { subjects } = await serverGet<SubjectsResponse>("/subjects");
  const subject = subjects.find((s) => s.slug === slug);
  if (!subject || subject.exam?.writing) notFound();

  const level = (["facil", "media", "dificil"] as const).find((n) => n === nivel) as Difficulty | undefined;

  return (
    <PracticeClient
      source={{ kind: "subject", subjectId: subject.id, subjectSlug: subject.slug, subjectName: subject.name, level }}
    />
  );
}
