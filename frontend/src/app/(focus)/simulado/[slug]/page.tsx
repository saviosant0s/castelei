import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PracticeClient } from "@/components/PracticeClient";
import { serverGet } from "@/lib/backend";
import type { Subject } from "@/lib/types";

export const metadata: Metadata = { title: "Simulado" };

export default async function SimuladoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { subjects } = await serverGet<{ subjects: Subject[] }>("/subjects");
  const subject = subjects.find((s) => s.slug === slug);
  if (!subject) notFound();

  return (
    <PracticeClient
      source={{ kind: "exam", subjectId: subject.id, subjectSlug: subject.slug, subjectName: subject.name }}
    />
  );
}
