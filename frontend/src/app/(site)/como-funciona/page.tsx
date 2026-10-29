import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Lightbulb, Repeat, Target, Timer, TrendingUp } from "lucide-react";
import { StartLink } from "@/components/site/StartLink";
import { Card } from "@/components/ui";
import { getSiteCatalog } from "@/lib/site-catalog";

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
function steps(questionsPerLesson: number | null) {
  return [
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
      // O número só é dito enquanto for verdade em toda lição. Ver lib/site-catalog.ts.
      text: `Terminada a explicação, ${
        questionsPerLesson ? `vêm ${questionsPerLesson} questões por lição` : "vêm as questões da lição"
      }, com o relógio correndo. Saber o assunto e resolver sob pressão são habilidades diferentes, e a segunda também se treina.`,
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
}

/*
| Os princípios, na língua de quem estuda. O mapa completo (com onde cada
| regra mora no código) está em docs/principios-pedagogicos.md.
*/
const ciencia = [
  {
    title: "Responder ensina mais que reler",
    study: "Prática de recuperação · Roediger e Karpicke, 2006",
    app: "Uma semana depois, quem respondeu perguntas lembrava 61% do conteúdo; quem só releu, 40%. Por isso toda lição termina em questões, e a revisão abre as questões, nunca o texto.",
  },
  {
    title: "A memória curta é pequena",
    study: "Teoria da carga cognitiva · Sweller, 1988",
    app: "Uma ideia por tela, frases com no máximo duas vírgulas e nenhum termo sem explicação. Um verificador automático reprova o texto que passar disso.",
  },
  {
    title: "Palavra e imagem juntas fixam mais",
    study: "Dupla codificação · Paivio",
    app: "As lições trazem tabela, exemplo ou figura junto do texto, na mesma tela, para os dois caminhos da memória trabalharem ao mesmo tempo.",
  },
  {
    title: "Do concreto para o abstrato",
    study: "Esmaecimento da concretude · Fyfe, McNeil e Goldstone, 2014",
    app: "Toda lição começa com uma comparação do dia a dia, como o dedo que aponta antes da palavra pronome. A regra formal vem depois, quando já faz sentido.",
  },
  {
    title: "Revisar na hora certa",
    study: "Repetição espaçada · Cepeda e colegas, 2008, com 1.354 pessoas",
    app: "O melhor intervalo entre revisões é uma fatia do tempo que falta até a prova. O app marca as revisões sozinho a partir da data da sua prova, e aperta o ritmo conforme ela chega.",
  },
  {
    title: "Saber o assunto não é saber a prova",
    study: "Como as bancas montam as alternativas",
    app: "Cada lição tem uma etapa só para o jeito que o tema cai e outra só para as pegadinhas. Errar no treino, com a explicação na hora, é o que evita errar no dia.",
  },
];

export default async function ComoFunciona() {
  const { questionsPerLesson } = await getSiteCatalog();
  const passos = steps(questionsPerLesson);

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
        {passos.map(({ icon: Icon, title, text }, i) => (
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
            <h3 className="text-base font-bold">Toda alternativa errada é um erro de verdade</h3>
            <p className="mt-2 text-base text-content-secondary">
              Nada de opção absurda para encher a lista. Cada uma imita um engano que a prova explora: a
              palavra trocada, o “sempre” onde a regra tem exceção, a recíproca no lugar da contrapositiva.
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

      <section aria-labelledby="ciencia" className="mt-24">
        <h2 id="ciencia" className="text-2xl sm:text-3xl">
          A ciência por trás do método
        </h2>
        <p className="mt-3 max-w-xl text-base text-content-secondary">
          Nada aqui é gosto pessoal. Cada regra vem de um achado da pesquisa sobre memória, e virou uma coisa
          que o app faz por você.
        </p>

        {/*
        | Lista e não seis cartões iguais: cartões do mesmo tamanho pediriam
        | para ser comparados, e aqui cada linha é uma ideia diferente.
        */}
        <Card size="lg" radius="panel" className="mt-8 !p-0">
          <ul className="divide-y divide-ink/10">
            {ciencia.map(({ title, study, app }) => (
              <li key={title} className="grid gap-2 p-6 sm:grid-cols-[1fr_1.2fr] sm:gap-8">
                <div>
                  <h3 className="text-base font-bold">{title}</h3>
                  <p className="mt-1 text-sm text-content-subtle">{study}</p>
                </div>
                <p className="text-base text-content-secondary">{app}</p>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <Card tone="bold" size="lg" radius="panel" className="mt-24 sm:p-10">
        <h2 className="text-3xl">Veja numa lição de verdade.</h2>
        <p className="mt-4 max-w-lg text-base on-bold-secondary">
          É mais rápido do que ler sobre o método. Escolha uma matéria, faça a primeira lição e responda as
          primeiras questões no cronômetro.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <StartLink />
          <Link href="/materias" className="btn btn-ghost border-2 border-on-bold/25 text-on-bold hover:bg-on-bold/10">
            Ver as matérias
          </Link>
        </div>
      </Card>
    </main>
  );
}
