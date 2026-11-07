import { unstable_rethrow } from "next/navigation";
import { BackButton } from "@/components/app/BackButton";
import { serverGet } from "@/lib/backend";
import type { SubjectsResponse } from "@/lib/types";

/** O vocabulário volta para a matéria, com o nome dela (mesmo pedido da página). */
export default async function Voltar({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let destino = { href: `/materia/${slug}`, label: "Matéria" };
  try {
    const { subjects } = await serverGet<SubjectsResponse>("/subjects");
    const subject = subjects.find((s) => s.slug === slug);
    if (subject) destino = { href: `/materia/${subject.slug}`, label: subject.name };
  } catch (error) {
    unstable_rethrow(error);
  }
  return <BackButton {...destino} />;
}
