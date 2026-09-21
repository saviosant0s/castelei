import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Lightbulb, Repeat, Target, Timer, TrendingUp } from "lucide-react";
import { StartLink } from "@/components/site/StartLink";
import { Card } from "@/components/ui";
import { CATALOG } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Como funciona",
  description:
    "A lição em etapas, o modo prova com cronômetro e o relatório que aponta o tópico fraco: o método do Castelei, passo a passo.",
};

/*
| A página do método.
|
| A vitrine promete; esta página mostra. Ela existe para quem desconfia — e é
| bom que desconfie — de app de estudo que promete muito. Cada passo diz o que
| acontece na tela, na ordem em que acontece.
*/
const steps = [
  {
    icon: BookOpen,
    title: "Uma ideia por tela",
    text: "A lição não é um texto corrido que você rola até o fim. São etapas curtas, uma ideia em cada, com analogia antes da definição e exemplo concreto antes da regra. Nenhum termo aparece sem ter sido explicado antes, na própria lição.",
  },
  {
    icon: Target,
    title: "Como o assunto cai na prova",
    text: "Uma etapa só para isso: os formatos de pergunta que o tema costuma assumir e as palavras que denunciam cada formato. É a parte que quase nenhum material traz — e é o que separa quem entendeu de quem acerta.",
  },
  {
    icon: Lightbulb,
    title: "A pegadinha, antes do erro",
    text: "O erro clássico aparece com nome e explicação enquanto você ainda está aprendendo. Errar no treino é barato; errar na prova, não.",
  },
  {
    icon: Timer,
    title: "Modo Prova, com cronômetro",
    text: `Terminada a explicação, vêm ${CATALOG.questionsPerLesson} questões por lição, com o relógio correndo. Saber o assunto e resolver sob pressão são habilidades diferentes, e a segunda também se treina.`,
  },
  {
    icon: TrendingUp,
    title: "O resultado diz o que fazer",
    text: "No fim: seu acerto, seu recorde e o tópico que mais te derrubou. O relatório guarda acerto e tempo separados — tempo e acerto contam histórias diferentes e nunca dividem o mesmo eixo.",
  },
  {
    icon: Repeat,
    title: "Repetir até virar automático",
    text: "Dá para refazer a lição quantas vezes quiser, e fazer o simulado da matéria inteira, com questões sorteadas em rodízio entre todas as lições — misturado, como na prova.",
  },
];

export default function ComoFunciona() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12 sm:px-6">
      <header>
        <p className="label-mono">O método</p>
        <h1 className="mt-4 max-w-2xl text-4xl sm:text-5xl">
          Entender o assunto é metade. A outra metade é reconhecer a pergunta.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-content-secondary">
          Quase todo material de estudo para na primeira metade. Você fecha o livro achando que sabe, abre a
          prova e a pergunta vem embrulhada num jeito de falar que você nunca viu. O Castelei ensina as duas.
        </p>
      </header>

      <ol className="mt-14 space-y-4">
        {steps.map(({ icon: Icon, title, text }, i) => (
          <li key={title}>
            <Card tone={i % 2 === 0 ? "raised" : "sunken"} size="lg" radius="panel">
              <div className="flex items-start gap-4">
                <span className="font-mono text-2xl font-medium text-sky">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className="flex items-start gap-2.5 text-2xl leading-tight">
                    <Icon className="mt-0.5 size-6 shrink-0 text-sky" aria-hidden="true" /> {title}
                  </h2>
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-content-secondary">{text}</p>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ol>

      <section aria-labelledby="principios" className="mt-24">
        <h2 id="principios" className="text-2xl sm:text-3xl">
          As regras que a gente não quebra
        </h2>
        <p className="mt-3 max-w-xl text-base text-content-secondary">
          Elas valem para toda lição escrita, e um verificador automático reprova o texto que fugir delas.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card tone="outline" size="lg">
            <h3 className="text-base font-bold">Escrito para quem parte do zero</h3>
            <p className="mt-2 text-base text-content-secondary">
              Se um iniciante trava numa frase, a frase está errada — não a pessoa. Mais etapas, mais
              exemplos, menos pressa.
            </p>
          </Card>
          <Card tone="outline" size="lg">
            <h3 className="text-base font-bold">Sem termo solto</h3>
            <p className="mt-2 text-base text-content-secondary">
              Nenhuma palavra técnica aparece antes de ser explicada, e nada de &quot;como vimos
              anteriormente&quot;: cada lição se sustenta sozinha.
            </p>
          </Card>
          <Card tone="outline" size="lg">
            <h3 className="text-base font-bold">Comando sempre diz onde funciona</h3>
            <p className="mt-2 text-base text-content-secondary">
              Windows ou Linux, PowerShell ou terminal. Quando há dois jeitos, os dois aparecem — e o app
              explica até como abrir o terminal.
            </p>
          </Card>
          <Card tone="outline" size="lg">
            <h3 className="text-base font-bold">Conteúdo próprio e atualizado</h3>
            <p className="mt-2 text-base text-content-secondary">
              As lições e as figuras são nossas. Quando uma fonte comum está defasada, a lição traz o que vale
              hoje.
            </p>
          </Card>
        </div>
      </section>

      <Card tone="bold" size="lg" radius="panel" className="mt-24 sm:p-10">
        <h2 className="text-3xl">Veja numa lição de verdade.</h2>
        <p className="mt-4 max-w-lg text-base on-bold-secondary">
          É mais rápido do que ler sobre o método. Escolha uma matéria, faça a primeira lição e responda as
          primeiras questões no cronômetro.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <StartLink />
          <Link href="/materias" className="btn btn-ghost border-2 border-paper/25 text-paper hover:bg-paper/10">
            Ver as matérias
          </Link>
        </div>
      </Card>
    </main>
  );
}
