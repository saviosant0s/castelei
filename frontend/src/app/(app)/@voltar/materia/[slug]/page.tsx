import { unstable_rethrow } from "next/navigation";
import { BackButton } from "@/components/app/BackButton";
import { OUTRAS } from "@/lib/areas";
import { serverGet } from "@/lib/backend";
import type { SubjectsResponse } from "@/lib/types";

/*
| A matéria volta para a área dela. O pedido de `/subjects` é o mesmo que a
| página faz, com os mesmos cabeçalhos: o Next junta os dois numa chamada só.
| Falhou, o voltar leva ao Início — o cabeçalho nunca derruba a tela.
*/
export default async function Voltar({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let destino = { href: "/inicio", label: "Início" };
  try {
    const { areas, subjects } = await serverGet<SubjectsResponse>("/subjects");
    const subject = subjects.find((s) => s.slug === slug);
    if (subject) {
      const area = (areas ?? []).find((a) => a.slug === subject.area) ?? OUTRAS;
      destino = { href: `/area/${area.slug}`, label: area.name };
    }
  } catch (error) {
    unstable_rethrow(error);
  }
  return <BackButton {...destino} />;
}
