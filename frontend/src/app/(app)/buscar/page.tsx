import type { Metadata } from "next";
import Link from "next/link";
import { BookA, BookOpen, NotebookPen, Search } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { serverGet } from "@/lib/backend";

export const metadata: Metadata = { title: "Buscar" };

interface SearchResponse {
  query: string;
  lessons: { id: number; title: string; summary: string; subject: { slug: string; name: string } }[];
  terms: { word: string; meaning: string; lesson: { id: number; title: string }; subject: { slug: string; name: string } }[];
  notes: { lesson: { id: number; title: string }; subject: { name: string }; excerpt: string }[];
}

/*
| Buscar em todas as matérias: lições, palavras do vocabulário e as suas
| anotações.
|
| É um formulário de verdade (GET com ?q=), não uma caixa que busca a cada
| tecla. Funciona sem JavaScript, o endereço pode ser compartilhado, e o
| botão "voltar" do celular devolve a pessoa à lista de resultados.
*/
export default async function BuscarPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim();
  const resultado = q.length >= 2 ? await serverGet<SearchResponse>(`/search?q=${encodeURIComponent(q)}`) : null;
  const total = resultado ? resultado.lessons.length + resultado.terms.length + resultado.notes.length : 0;

  return (
    <div className="space-y-8">
      <header>
        <p className="label-mono">Buscar</p>
        <h1 className="mt-1 text-4xl">O que você procura?</h1>
        <form action="/buscar" method="get" role="search" className="mt-5 flex gap-2">
          <label htmlFor="q" className="sr-only">
            Buscar lição, palavra ou anotação
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            autoFocus={!q}
            enterKeyHint="search"
            placeholder="Ex.: semáforo, tese, crase"
            className="field min-w-0 flex-1"
          />
          <button type="submit" className="btn btn-primary px-4" aria-label="Buscar">
            <Search className="size-5" aria-hidden="true" />
          </button>
        </form>
      </header>

      {!resultado ? (
        <p className="text-base text-content-secondary">
          Busca em todas as matérias: o título e o resumo das lições, as palavras do vocabulário e as suas anotações.
        </p>
      ) : total === 0 ? (
        <EmptyState
          icon={Search}
          title={`Nada encontrado para “${q}”`}
          description="Tente uma palavra só, ou outro jeito de escrever. A busca não diferencia acento."
        />
      ) : (
        <>
          {resultado.terms.length > 0 && (
            <section aria-labelledby="r-palavras">
              <h2 id="r-palavras" className="flex items-center gap-2 text-xl">
                <BookA className="size-5 text-sky" aria-hidden="true" /> Palavras
              </h2>
              <ul className="mt-3 space-y-2">
                {resultado.terms.map((t) => (
                  <li key={`${t.subject.slug}-${t.word}`}>
                    <Link href={`/licao/${t.lesson.id}`} className="block rounded-card bg-surface-raised px-4 py-3 shadow-lift">
                      <span className="block font-bold">{t.word}</span>
                      <span className="mt-0.5 block text-base">{t.meaning}</span>
                      <span className="mt-1 block text-sm text-content-subtle">
                        {t.subject.name} · {t.lesson.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {resultado.lessons.length > 0 && (
            <section aria-labelledby="r-licoes">
              <h2 id="r-licoes" className="flex items-center gap-2 text-xl">
                <BookOpen className="size-5 text-sage" aria-hidden="true" /> Lições
              </h2>
              <ul className="mt-3 space-y-2">
                {resultado.lessons.map((l) => (
                  <li key={l.id}>
                    <Link href={`/licao/${l.id}`} className="block rounded-card bg-surface-raised px-4 py-3 shadow-lift">
                      <span className="block font-bold">{l.title}</span>
                      <span className="mt-0.5 block text-sm text-content-secondary">{l.summary}</span>
                      <span className="mt-1 block text-sm text-content-subtle">{l.subject.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {resultado.notes.length > 0 && (
            <section aria-labelledby="r-notas">
              <h2 id="r-notas" className="flex items-center gap-2 text-xl">
                <NotebookPen className="size-5 text-coral" aria-hidden="true" /> Suas anotações
              </h2>
              <ul className="mt-3 space-y-2">
                {resultado.notes.map((n) => (
                  <li key={n.lesson.id}>
                    <Link href={`/licao/${n.lesson.id}`} className="block rounded-card bg-surface-raised px-4 py-3 shadow-lift">
                      <span className="block text-base">{n.excerpt}</span>
                      <span className="mt-1 block text-sm text-content-subtle">
                        {n.subject.name} · {n.lesson.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
