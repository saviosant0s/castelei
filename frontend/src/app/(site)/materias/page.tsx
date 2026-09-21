import type { Metadata } from "next";
import { ListChecks } from "lucide-react";
import { StartLink } from "@/components/site/StartLink";
import { Card } from "@/components/ui";
import { getSiteCatalog } from "@/lib/site-catalog";

export const metadata: Metadata = {
  title: "Matérias",
  description: "As matérias e lições disponíveis hoje no Castelei, com o que cada uma cobre.",
};

/*
| A vitrine do catálogo — a página que responde "tem o que eu preciso?".
|
| Ela mostra o nome de toda lição, e não só a contagem: quem procura um assunto
| específico decide em cinco segundos olhando a lista. Os dados vêm do backend
| (lib/site-catalog.ts), para matéria criada no painel aparecer aqui sozinha —
| e caem na lista escrita à mão se a API não responder a tempo.
*/
export default async function Materias() {
  const { subjects, totals, questionsPerLesson } = await getSiteCatalog();

  return (
    <main className="mx-auto max-w-4xl px-5 py-12 sm:px-6">
      <header>
        <p className="label-mono">O catálogo</p>
        <h1 className="mt-4 text-4xl sm:text-5xl">As matérias disponíveis hoje</h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-content-secondary">
          Toda lição segue a mesma receita: explicação humana, como o assunto cai na prova e as pegadinhas
          mais comuns
          {/* O número só é dito enquanto for verdade em toda lição. */}
          {questionsPerLesson ? ` — e termina com ${questionsPerLesson} questões em modo prova.` : ", e termina em modo prova, com cronômetro."}
        </p>
        <p className="mt-6 font-mono text-sm text-content-subtle">
          {totals.subjects} matérias · {totals.lessons} lições · {totals.questions} questões
        </p>
      </header>

      <div className="mt-12 space-y-6">
        {subjects.map((subject) => (
          <Card key={subject.slug} tone="raised" size="lg" radius="panel">
            <h2 className="text-2xl leading-tight break-words">{subject.name}</h2>
            <p className="mt-2 max-w-2xl text-base text-content-secondary">{subject.pitch}</p>

            <ol className="mt-6 space-y-2">
              {subject.lessons.map((lesson, i) => (
                <li
                  key={lesson}
                  className="flex items-start gap-3 rounded-control bg-surface-sunken px-4 py-3 text-base"
                >
                  <span className="font-mono text-sm font-medium text-sky">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="break-words">{lesson}</span>
                </li>
              ))}
            </ol>

            <p className="mt-4 flex items-center gap-2 text-sm text-content-subtle">
              <ListChecks className="size-4 shrink-0" aria-hidden="true" />
              Simulado disponível: questões sorteadas entre todas as lições da matéria.
            </p>
          </Card>
        ))}
      </div>

      <Card tone="bold" size="lg" radius="panel" className="mt-12 sm:p-10">
        <h2 className="text-2xl">O catálogo cresce junto com o semestre</h2>
        <p className="mt-3 max-w-lg text-base on-bold-secondary">
          As próximas lições de Sistemas Operacionais seguem a ordem das aulas: estrutura e arquitetura,
          processos e threads, comunicação entre processos, memória, arquivos, dispositivos e virtualização.
        </p>
        <StartLink className="btn btn-primary mt-8" />
      </Card>
    </main>
  );
}
