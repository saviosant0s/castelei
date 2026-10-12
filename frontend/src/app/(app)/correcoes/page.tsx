import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { NoteReview, type NoteReviewData } from "@/components/study/NoteReview";
import { EmptyState } from "@/components/ui";
import { serverGet } from "@/lib/backend";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Minhas correções" };

interface Correcao {
  id: number;
  note_text: string;
  review: NoteReviewData;
  created_at: string;
  lesson: { id: number; title: string };
  subject: { name: string | null };
}

/*
| Todas as correções por IA da "explicação para si mesmo", da mais nova para a
| mais antiga. Rever a de ontem não pode custar outra correção — cada uma fica
| guardada com o texto que foi corrigido, para comparar "o que eu disse" com
| "o que estava errado" mesmo depois de a anotação ser reescrita.
*/
export default async function CorrecoesPage() {
  const { reviews } = await serverGet<{ reviews: Correcao[] }>("/note-reviews");

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Nenhuma correção ainda"
        description="No fim de cada lição, explique com as suas palavras o que entendeu e toque em “Corrigir minha explicação”. Cada correção fica guardada aqui."
      />
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="label-mono">Anotações</p>
        <h1 className="mt-1 text-4xl">Minhas correções</h1>
        <p className="mt-2 text-base text-content-secondary">
          O que você explicou e o que a correção disse. Rever aqui não gasta correção.
        </p>
      </header>

      <ol className="space-y-6">
        {reviews.map((c) => (
          <li key={c.id} className="rounded-card bg-surface-raised px-5 py-4 shadow-lift">
            <p className="text-sm text-content-subtle">
              {c.subject.name ? `${c.subject.name} · ` : ""}
              {formatDateTime(c.created_at)}
            </p>
            <Link href={`/licao/${c.lesson.id}`} className="mt-1 block text-lg font-bold underline-offset-4 hover:underline">
              {c.lesson.title}
            </Link>
            <figure className="mt-3 border-l-4 border-ink/15 pl-3">
              <figcaption className="label-mono">O que você disse</figcaption>
              <blockquote className="mt-1 whitespace-pre-line text-base leading-relaxed text-content-secondary">
                {c.note_text}
              </blockquote>
            </figure>
            <NoteReview review={c.review} scroll={false} />
          </li>
        ))}
      </ol>
    </div>
  );
}
