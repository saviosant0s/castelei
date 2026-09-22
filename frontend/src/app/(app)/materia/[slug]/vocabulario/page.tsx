import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookA } from "lucide-react";
import { Card, EmptyState } from "@/components/ui";
import { serverGet } from "@/lib/backend";
import type { Subject, VocabularyResponse } from "@/lib/types";
import { agrupar, contagem, PARA_QUE_SERVE } from "@/lib/vocabulary";

export const metadata: Metadata = { title: "Vocabulário" };

/*
| O vocabulário da matéria.
|
| Nasceu de uma regra que já existia e não tinha para onde ir: "nunca use um
| termo sem explicá-lo antes". A explicação morava dentro da etapa em que a
| palavra estreia, e era ali que ela ficava — quem travasse na palavra três
| lições depois não tinha onde procurar, e voltava para o buscador, que é
| exatamente o lugar onde o app perde a pessoa.
|
| A lista NÃO VEM DE UMA TABELA DE GLOSSÁRIO: é montada das etapas das lições
| (ver App\Support\Content\Vocabulary). Uma tabela à parte envelheceria calada
| e passaria a discordar da lição.
*/
export default async function VocabularioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { subjects } = await serverGet<{ subjects: Subject[] }>("/subjects");
  const subject = subjects.find((s) => s.slug === slug);
  if (!subject) notFound();

  const { terms } = await serverGet<VocabularyResponse>(
    `/subjects/${subject.id}/vocabulario`,
  );
  const grupos = agrupar(terms);

  return (
    <div className="space-y-8">
      <Link
        href={`/materia/${subject.slug}`}
        className="inline-flex min-h-11 items-center gap-2 text-base text-content-secondary hover:text-ink"
      >
        <ArrowLeft className="size-5" aria-hidden="true" /> {subject.name}
      </Link>

      <header>
        <p className="label-mono">Vocabulário</p>
        <h1 className="mt-2 text-4xl">{subject.name}</h1>
        <p className="mt-3 text-base text-content-secondary">
          {PARA_QUE_SERVE}
        </p>
        <p className="mt-2 font-mono text-sm text-content-subtle">
          {contagem(terms.length)}
        </p>
      </header>

      {terms.length === 0 ? (
        <EmptyState
          icon={BookA}
          level="h2"
          title="Ainda não há palavras aqui"
          description="As palavras desta página vêm das lições: cada termo novo é explicado na etapa em que aparece pela primeira vez. Assim que as lições trouxerem esses blocos, eles aparecem aqui sozinhos."
          action={{
            label: `Ver as lições de ${subject.name}`,
            href: `/materia/${subject.slug}`,
          }}
        />
      ) : (
        <div>
          {/*
          | O atalho do alfabeto, como a borda recortada de um dicionário de
          | papel. Com uma centena e meia de palavras, rolar até o "S" é
          | trabalho demais para quem só travou numa palavra e quer voltar
          | para a lição. São âncoras: sem JavaScript, e funcionam com o
          | botão de voltar.
          */}
          <nav
            aria-label="Ir para uma letra"
            className="mb-6 flex flex-wrap gap-1.5"
          >
            {grupos.map((grupo) => (
              <a
                key={grupo.letra}
                href={`#letra-${grupo.letra}`}
                className="grid size-9 place-items-center rounded-control bg-surface-sunken font-mono text-sm font-bold text-content-secondary transition hover:bg-sky-soft hover:text-ink"
              >
                {grupo.letra}
              </a>
            ))}
          </nav>

          {/*
          | AS SEÇÕES FICAM COLADAS, e a folga mora no `pb-8` da lista.
          | A letra gruda no topo enquanto a caixa de CONTEÚDO da seção está
          | na tela; espaço entre as seções, ou padding na própria seção,
          | fica fora dessa caixa e a letra desgruda cedo. É a mesma armadilha
          | do cabeçalho de módulo da trilha, e ela já cobrou uma vez: sem
          | isto, 16 trechos da rolagem ficavam sem letra nenhuma no topo.
          */}
          {grupos.map((grupo) => (
            <section key={grupo.letra} aria-labelledby={`letra-${grupo.letra}`}>
              <h2
                id={`letra-${grupo.letra}`}
                className="sticky top-0 z-10 -mx-5 bg-surface px-5 pb-2 font-mono text-sm font-bold tracking-wide text-content-subtle"
                style={{
                  paddingTop: "max(env(safe-area-inset-top, 0px), 0.5rem)",
                  // O grão do fundo vai junto, senão a faixa chapada aparece
                  // como um retângulo liso por cima da página texturizada.
                  backgroundImage: "var(--grain)",
                }}
              >
                {grupo.letra}
              </h2>

              <ul className="space-y-3 pb-8">
                {grupo.termos.map((termo) => (
                  <li key={termo.word}>
                    {/*
                    | O cartão inteiro leva à lição. A palavra sozinha não
                    | resolve quem travou: ele precisa do lugar onde ela é
                    | explicada por inteiro, com analogia e exemplo.
                    */}
                    <Card href={`/licao/${termo.lesson.id}`} size="sm">
                      <p className="text-base font-bold">{termo.word}</p>
                      <p className="mt-1 text-base leading-relaxed text-content-secondary">
                        {termo.meaning}
                      </p>
                      <p className="mt-2 text-sm text-content-subtle">
                        Explicada na lição {termo.lesson.position}:{" "}
                        {termo.lesson.title}
                      </p>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
