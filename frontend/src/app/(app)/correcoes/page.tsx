import type { Metadata } from "next";
import Link from "next/link";
import { NoteReview, type NoteReviewData } from "@/components/study/NoteReview";
import { EmptyState, PageHero } from "@/components/ui";
import { serverGet } from "@/lib/backend";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Minhas dúvidas e correções" };

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
interface Duvida {
  id: number;
  question: string;
  answer: string;
  created_at: string;
  lesson: { id: number; title: string };
  subject: { name: string | null };
}

export default async function CorrecoesPage() {
  const [{ reviews }, { doubts }] = await Promise.all([
    serverGet<{ reviews: Correcao[] }>("/note-reviews"),
    serverGet<{ doubts: Duvida[] }>("/doubts"),
  ]);

  if (reviews.length === 0 && doubts.length === 0) {
    return (
      <EmptyState
        art="correcoes"
        title="Nada por aqui ainda"
        description="No fim de cada lição dá para tirar uma dúvida ou pedir a correção da sua explicação. Tudo fica guardado aqui, para rever sem gastar de novo."
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHero eyebrow="Anotações" title="Minhas dúvidas e correções">
        O que você perguntou, o que explicou e o que a IA respondeu. Rever aqui não gasta nada.
      </PageHero>

      {doubts.length > 0 && (
        <section aria-labelledby="h-duvidas" className="space-y-4">
          <h2 id="h-duvidas" className="text-2xl">Dúvidas</h2>
          <ol className="space-y-4">
            {doubts.map((d) => (
              <li key={d.id} className="rounded-card bg-surface-raised px-5 py-4 shadow-lift">
                <p className="text-sm text-content-subtle">
                  {d.subject.name ? `${d.subject.name} · ` : ""}
                  {formatDateTime(d.created_at)}
                </p>
                <Link href={`/licao/${d.lesson.id}`} className="mt-1 block text-lg font-bold underline-offset-4 hover:underline">
                  {d.lesson.title}
                </Link>
                <p className="mt-3 font-bold">{d.question}</p>
                <p className="mt-2 whitespace-pre-line rounded-2xl bg-sky-soft px-4 py-3 text-base leading-relaxed">{d.answer}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {reviews.length > 0 && <h2 className="text-2xl">Correções</h2>}

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
