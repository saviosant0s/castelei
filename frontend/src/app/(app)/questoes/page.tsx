import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { EmptyState, PageHero } from "@/components/ui";
import { serverGet } from "@/lib/backend";
import { groupByArea } from "@/lib/areas";
import { pluralize } from "@/lib/format";
import { materiasDeQuestao, totalDaLicao } from "@/lib/question-bank";
import type { SubjectsResponse } from "@/lib/types";

export const metadata: Metadata = { title: "Questões" };

/*
| A aba Questões: treinar fora da trilha. Primeiro a matéria, depois a lição.
| Fica separada da lição de propósito: quem termina de estudar faz as
| questões da lição, sem escolher nada; quem quer treinar vem aqui.
*/
export default async function QuestoesPage() {
  const { areas, subjects } = await serverGet<SubjectsResponse>("/subjects");
  const { ativas } = groupByArea(areas ?? [], materiasDeQuestao(subjects));

  return (
    <div className="space-y-7">
      <PageHero title="Questões">Escolha a matéria e a lição que quer treinar.</PageHero>

      {ativas.length === 0 ? (
        <EmptyState level="h2" art="em-breve" title="Ainda sem questões" description="Quando houver matéria com questões, ela aparece aqui." />
      ) : (
        ativas.map((area) => (
          <section key={area.slug} aria-labelledby={`q-${area.slug}`}>
            <h2 id={`q-${area.slug}`} className="label-mono px-1">
              {area.name}
            </h2>
            <ul className="mt-2 divide-y divide-ink/10 overflow-hidden rounded-card bg-surface-raised shadow-lift">
              {area.subjects.map((subject) => {
                const total = subject.lessons.reduce((soma, l) => soma + totalDaLicao(l), 0);
                return (
                  <li key={subject.id}>
                    <Link href={`/questoes/${subject.slug}`} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-surface-sunken/60">
                      <span className="min-w-0 flex-1">
                        <span className="block text-base font-bold">{subject.name}</span>
                        <span className="block text-sm text-content-subtle">
                          {pluralize(subject.lessons.length, "lição", "lições")} · {pluralize(total, "questão", "questões")}
                        </span>
                      </span>
                      <ChevronRight className="size-5 shrink-0 text-content-faint" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
