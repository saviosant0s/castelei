import { createElement } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SubjectArt, subjectArtKey } from "@/components/illustrations/SubjectArt";
import { SubjectRow, nextLessonLine, tones } from "@/components/home/SubjectRow";
import { EmptyState, PageHero } from "@/components/ui";
import { serverGet } from "@/lib/backend";
import { areaIcon, groupByArea, OUTRAS, subjectIcon } from "@/lib/areas";
import { pluralize } from "@/lib/format";
import type { SubjectsResponse } from "@/lib/types";

export const metadata: Metadata = { title: "Área" };

export default async function AreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { areas, subjects } = await serverGet<SubjectsResponse>("/subjects");
  const { ativas } = groupByArea(areas ?? [], subjects);

  const ativa = ativas.find((a) => a.slug === slug);
  const area = ativa ?? (areas ?? []).find((a) => a.slug === slug) ?? (slug === OUTRAS.slug ? OUTRAS : null);
  if (!area) notFound();

  const lista = ativa?.subjects ?? [];

  return (
    <div className="space-y-6">
      <Link href="/inicio" className="inline-flex min-h-11 items-center gap-2 text-base text-content-secondary hover:text-ink">
        <ArrowLeft className="size-5" aria-hidden="true" /> Início
      </Link>

      <PageHero
        title={area.name}
        art={
          // O desenho da área; a que ainda não tem desenho fica com o ícone.
          subjectArtKey({ slug: area.slug, area: area.slug }) ? (
            <SubjectArt name={area.slug} />
          ) : (
            <span className="grid size-16 place-items-center rounded-control bg-sky-soft text-sky">
              {createElement(areaIcon(area.slug), { className: "size-8", "aria-hidden": true })}
            </span>
          )
        }
      >
        {lista.length > 0 && pluralize(lista.length, "matéria", "matérias")}
      </PageHero>

      {lista.length === 0 ? (
        // Só chega aqui quem digitou o endereço: a tela inicial não liga para área vazia.
        <EmptyState
          level="h2"
          art="em-breve"
          title="Em breve"
          description="Esta área ainda não tem aula no Castelei. Enquanto isso, as outras estão abertas."
          action={{ href: "/inicio", label: "Ver as áreas" }}
        />
      ) : (
        <ul className="space-y-3">
          {lista.map((subject, i) => {
            const practiced = subject.lessons.filter((lesson) => lesson.attempts > 0).length;
            return (
              <li key={subject.id}>
                <SubjectRow
                  href={`/materia/${subject.slug}`}
                  name={subject.name}
                  icon={subjectIcon(subject)}
                  tone={tones[i % tones.length]}
                  practiced={practiced}
                  total={subject.lessons.length}
                  // A privada só aparece para quem administra: o aviso lembra que ninguém mais a vê.
                  detail={`${subject.private ? "Só você vê · " : ""}${nextLessonLine(subject.lessons)}`}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
