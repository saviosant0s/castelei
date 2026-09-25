import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Flashcards } from "@/components/study/Flashcards";
import { serverGet } from "@/lib/backend";
import type { Subject, VocabularyResponse } from "@/lib/types";
import { baralho } from "@/lib/flashcards";

export const metadata: Metadata = { title: "Cartões" };

export default async function CartoesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { subjects } = await serverGet<{ subjects: Subject[] }>("/subjects");
  const subject = subjects.find((s) => s.slug === slug);
  if (!subject) notFound();

  const { terms } = await serverGet<VocabularyResponse>(`/subjects/${subject.id}/vocabulario`);

  // O embaralhamento acontece aqui, no servidor: sorteado no navegador, a tela
  // desenhada pelo servidor e a do navegador discordariam na primeira carta.
  return <Flashcards subject={{ slug: subject.slug, name: subject.name }} cards={baralho(terms, Math.random)} />;
}
