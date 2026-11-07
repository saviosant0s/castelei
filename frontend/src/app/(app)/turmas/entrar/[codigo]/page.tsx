import type { Metadata } from "next";
import Link from "next/link";
import { Eye } from "lucide-react";
import { Card, PageHero } from "@/components/ui";
import { JoinButton } from "@/components/classroom/ClassroomActions";
import { serverGet } from "@/lib/backend";
import { cleanCode, type ClassroomPreview } from "@/lib/classrooms";

export const metadata: Metadata = { title: "Entrar na turma" };

/*
| O convite. Antes de entrar, a pessoa lê de quem é a turma e o que o dono vai
| ver. Entrar numa turma é mostrar o progresso a outra pessoa; isso precisa
| estar escrito antes do botão, e não num termo que ninguém abre.
*/
export default async function EntrarNaTurmaPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const code = cleanCode(codigo);
  const { classroom } = await serverGet<ClassroomPreview>(`/classrooms/code/${code}`);

  if (classroom.is_owner || classroom.is_member) {
    return (
      <div className="space-y-6">
        <PageHero eyebrow="Turma" title={classroom.name}>
          {classroom.is_owner ? "Esta turma é sua." : "Você já está nesta turma."}
        </PageHero>
        <Link href={`/turmas/${classroom.id}`} className="btn btn-primary w-full">
          Abrir a turma
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero eyebrow={`Turma de ${classroom.owner.name}`} title={classroom.name}>
        {classroom.subject?.name}
      </PageHero>

      <Card tone="sky" className="flex gap-4">
        <Eye className="mt-0.5 size-6 shrink-0 text-sky" aria-hidden={true} />
        <div className="space-y-2 text-base">
          <p className="font-bold">{classroom.owner.name} vai ver o seu progresso em {classroom.subject?.name ?? "nesta matéria"}.</p>
          <p className="text-content-secondary">
            Quantas lições você praticou, o seu acerto e quando estudou pela última vez. Só nesta matéria: o resto do que você estuda
            continua só seu. O seu e-mail não aparece. Você pode sair da turma quando quiser.
          </p>
        </div>
      </Card>

      <JoinButton code={code} />
      <Link href="/turmas" className="btn btn-ghost w-full">
        Agora não
      </Link>
    </div>
  );
}
