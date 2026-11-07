import { createElement } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SubjectArt, subjectArtKey } from "@/components/illustrations/SubjectArt";
import { SoonRow, SubjectRow, nextLessonLine, tones } from "@/components/home/SubjectRow";
import { EmptyState, PageHero } from "@/components/ui";
import { serverGet } from "@/lib/backend";
import { areaGroupsView, areaIcon, groupByArea, OUTRAS, subjectIcon } from "@/lib/areas";
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
  const grupos = areaGroupsView("groups" in area ? area.groups : undefined, lista);

  return (
    <div className="space-y-6">
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
        {lista.length > 0 && `${pluralize(lista.length, "matéria", "matérias")}, na ordem de estudo`}
      </PageHero>

      {grupos.length === 0 ? (
        // Só chega aqui quem digitou o endereço: a tela inicial não liga para área vazia.
        <EmptyState
          level="h2"
          art="em-breve"
          title="Em breve"
          description="Esta área ainda não tem aula no Castelei. Enquanto isso, as outras estão abertas."
          action={{ href: "/inicio", label: "Ver as áreas" }}
        />
      ) : (
        /*
        | Os grupos da área, na ordem de estudo (pedido do Sávio: Informática
        | era uma lista solta de hardware, programação e IA). O número diz por
        | onde começar e NÃO tranca nada: quem já sabe o 1 vai direto ao 3.
        | A tranca mora dentro da matéria, entre uma lição e a próxima.
        */
        <div className="space-y-7">
          {grupos.map((grupo) => (
            <section key={grupo.name ?? "lista"} aria-label={grupo.name ?? undefined}>
              {grupo.name && <h2 className="label-mono mb-3">{grupo.name}</h2>}
              <ul className="space-y-3">
                {grupo.entries.map((entry) =>
                  entry.kind === "soon" ? (
                    <li key={`em-breve-${entry.name}`}>
                      <SoonRow name={entry.name} />
                    </li>
                  ) : (
                    <li key={entry.subject.id}>
                      <SubjectRow
                        href={`/materia/${entry.subject.slug}`}
                        name={entry.subject.name}
                        icon={subjectIcon(entry.subject)}
                        tone={tones[(entry.step - 1) % tones.length]}
                        step={entry.step}
                        practiced={entry.subject.lessons.filter((lesson) => lesson.attempts > 0).length}
                        total={entry.subject.lessons.length}
                        // A privada só aparece para quem administra: o aviso lembra que ninguém mais a vê.
                        detail={`${entry.subject.private ? "Só você vê · " : ""}${nextLessonLine(entry.subject.lessons)}`}
                      />
                    </li>
                  ),
                )}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
