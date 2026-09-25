import Link from "next/link";
import {
  BookOpen,
  Check,
  Flame,
  Lightbulb,
  ListChecks,
  Smartphone,
  Target,
  Timer,
  TrendingUp,
} from "lucide-react";
import { StartLink } from "@/components/site/StartLink";
import { Card } from "@/components/ui";
import { getSiteCatalog } from "@/lib/site-catalog";

/*
| A vitrine.
|
| Ela responde três perguntas, nesta ordem, porque é a ordem em que a pessoa
| pensa: o que é isso, como é por dentro, e quanto custa. A prova de que
| funciona não é adjetivo — é a questão de verdade logo no começo da página,
| com a pegadinha à mostra.
*/
const layers = [
  {
    icon: BookOpen,
    title: "Explicação humana",
    text: "O assunto contado como uma pessoa explicaria, com exemplo do dia a dia antes da definição. Sem jargão que não foi apresentado.",
    indent: "",
  },
  {
    icon: Target,
    title: "Como cai na prova",
    text: "Os formatos de pergunta que o assunto assume e as palavras-chave que denunciam cada um.",
    indent: "sm:ml-10",
  },
  {
    icon: Lightbulb,
    title: "Pegadinhas",
    text: "Os erros mais comuns, mostrados antes de você cair neles — e não depois, no gabarito.",
    indent: "sm:ml-20",
  },
];

const features = [
  {
    icon: Timer,
    title: "Modo Prova, com cronômetro",
    text: "Terminada a lição, você responde questões no tempo — porque saber o assunto e resolver sob pressão são duas habilidades diferentes.",
  },
  {
    icon: Target,
    title: "Resultado que aponta o dedo",
    text: "No fim de cada treino: seu acerto, seu recorde e qual tópico está te derrubando. Sem gráfico bonito que não diz o que fazer.",
  },
  {
    icon: TrendingUp,
    title: "Progresso por tópico",
    text: "Acerto e tempo, tópico a tópico, com a evolução ao longo das tentativas. Dá para ver o que já está dominado e parar de revisar à toa.",
  },
  {
    icon: ListChecks,
    title: "Simulado da matéria inteira",
    text: "Questões sorteadas em rodízio entre todas as lições da matéria, como na prova de verdade: misturado, sem aviso de qual assunto vem.",
  },
  {
    icon: Flame,
    title: "Dias seguidos, XP e conquistas",
    text: "O que segura o estudo não é motivação, é constância. A sequência de dias e as conquistas existem para dar o empurrão nos dias ruins.",
  },
  {
    icon: Smartphone,
    title: "Instala no celular",
    text: "Abre da tela inicial como qualquer aplicativo, em tela cheia, sem barra de navegador. Funciona bem numa conexão ruim.",
  },
];

const faq = [
  {
    q: "Preciso pagar para usar?",
    a: "Não. O app está em fase de testes e, durante ela, tudo está liberado: todas as lições e todas as questões, sem limite. Os planos pagos entram depois, e quem estuda de graça continua estudando de graça.",
  },
  {
    q: "Serve para qual prova?",
    a: "Para qualquer prova que cobre os assuntos do catálogo — trabalho de faculdade, concurso, vestibular. O que o Castelei treina é o assunto e o jeito que a banca pergunta, e esse jeito se repete.",
  },
  {
    q: "É mais um app que só mostra videoaula?",
    a: "Não tem vídeo. É texto curto, uma ideia por tela, seguido de questão. Você passa a maior parte do tempo respondendo, que é o que faz o conteúdo ficar.",
  },
  {
    q: "E os meus dados?",
    a: "Guardamos o mínimo: quem é você e como você está indo. Sem anúncios, sem rastreador de terceiros, sem venda de dados. Está tudo escrito na Política de Privacidade — e você apaga a conta pelo próprio app, quando quiser.",
  },
];

export default async function Landing() {
  const { subjects, totals } = await getSiteCatalog();

  return (
    <main className="mx-auto max-w-5xl px-5 pb-8 pt-10 sm:px-6 sm:pt-16">
      <section className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <div>
          <p className="label-mono">Estudo para provas</p>
          <h1 className="mt-4 text-4xl sm:text-5xl">Aprenda o assunto e a língua que a prova fala.</h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-content-secondary">
            Saber a matéria e reconhecer a pergunta são duas coisas. Cada lição do Castelei explica do jeito
            humano, mostra como o tema costuma cair e aponta as pegadinhas antes de você errar. Depois você
            treina em modo prova, com cronômetro.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <StartLink />
            <Link href="/como-funciona" className="btn btn-ghost border-2 border-ink/15">
              Ver como funciona
            </Link>
          </div>

          <p className="mt-6 font-mono text-sm text-content-subtle">
            {totals.subjects} matérias · {totals.lessons} lições · {totals.questions} questões · tudo
            liberado durante os testes
          </p>
        </div>

        {/*
        | A prova do produto. Uma questão de verdade, com a pegadinha escrita —
        | vale mais do que qualquer frase dizendo que o app é bom.
        */}
        <section aria-label="Exemplo de questão do app">
          <Card tone="raised" size="lg" radius="panel" className="-rotate-1">
            <p className="label-mono">Questão 3 de 8 · Sistemas Operacionais</p>
            <p className="mt-3 font-display text-xl font-bold leading-snug">
              Você ouve música, baixa um arquivo e escreve um texto ao mesmo tempo. O SO reveza o processador
              entre esses programas e reparte a memória entre eles. Esse exemplo ilustra o SO como:
            </p>
            <ul className="mt-4 space-y-2 text-base">
              <li className="flex items-center gap-3 rounded-control border-2 border-ink/10 px-3 py-2">
                <span className="font-mono text-sm text-content-subtle">A</span> máquina estendida
              </li>
              <li className="flex items-center gap-3 rounded-control border-2 border-sage bg-sage-soft px-3 py-2">
                <Check className="size-4 shrink-0" aria-hidden="true" /> gerenciador de recursos
              </li>
              <li className="flex items-center gap-3 rounded-control border-2 border-ink/10 px-3 py-2">
                <span className="font-mono text-sm text-content-subtle">C</span> interface gráfica
              </li>
            </ul>
            <p className="mt-4 rounded-control bg-coral-soft px-3 py-2 text-sm">
              <strong>Pegadinha:</strong> vários programas ao mesmo tempo não significa vários processadores.
              É o SO revezando o tempo do mesmo.
            </p>
          </Card>
        </section>
      </section>

      <section aria-labelledby="camadas" className="mt-24">
        <h2 id="camadas" className="text-2xl sm:text-3xl">
          Três camadas em toda lição
        </h2>
        <p className="mt-3 max-w-xl text-base text-content-secondary">
          Não é resumo nem videoaula. É a sequência que falta na maioria dos materiais.
        </p>

        <ol className="mt-8 space-y-4">
          {layers.map(({ icon: Icon, title, text, indent }, i) => (
            <li key={title} className={indent}>
              <Card tone="sunken" size="lg" className="flex items-start gap-4">
                <span className="font-mono text-2xl font-medium text-sky">0{i + 1}</span>
                <div>
                  <h3 className="flex items-center gap-2 text-base font-bold">
                    <Icon className="size-5" aria-hidden="true" /> {title}
                  </h3>
                  <p className="mt-1 text-base text-content-secondary">{text}</p>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="materias" className="mt-24">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="materias" className="text-2xl sm:text-3xl">
            O que dá para estudar hoje
          </h2>
          <Link href="/materias" className="text-base font-bold underline underline-offset-4">
            Ver as lições
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {subjects.map((subject, i) => (
            <Card
              key={subject.slug}
              href="/materias"
              tone={i === 0 ? "sky" : "outline"}
              size="lg"
              radius="panel"
            >
              <p className="label-mono">
                {subject.lessons.length} {subject.lessons.length === 1 ? "lição" : "lições"}
              </p>
              <h3 className="mt-2 text-2xl leading-tight break-words">{subject.name}</h3>
              <p className="mt-3 text-base text-content-secondary">{subject.pitch}</p>
            </Card>
          ))}
        </div>

        <p className="mt-6 text-base text-content-subtle">
          O catálogo cresce a cada atualização, acompanhando as aulas do semestre.
        </p>
      </section>

      <section aria-labelledby="recursos" className="mt-24">
        <h2 id="recursos" className="text-2xl sm:text-3xl">
          Estudar é responder, não só ler
        </h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, text }) => (
            <Card key={title} tone="raised" size="lg">
              <h3 className="flex items-center gap-2.5 text-base font-bold">
                <Icon className="size-5 shrink-0 text-sky" aria-hidden="true" /> {title}
              </h3>
              <p className="mt-2 text-base text-content-secondary">{text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="planos" aria-labelledby="planos-titulo" className="mt-24 scroll-mt-24">
        <h2 id="planos-titulo" className="text-2xl sm:text-3xl">
          Comece de graça
        </h2>

        <Card tone="sage" size="lg" radius="panel" className="mt-6">
          <p className="text-base">
            <strong>Tudo liberado enquanto o app está em testes.</strong> Os planos abaixo mostram como vai ficar
            depois — e quase tudo continua no grátis.
          </p>
        </Card>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card tone="outline" size="lg" radius="panel">
            <p className="label-mono">Grátis · para sempre</p>
            <p className="mt-2 font-mono text-2xl font-medium">R$ 0</p>
            <p className="mt-3 text-base text-content-secondary">
              Todas as lições e todas as questões, a trilha, o vocabulário, a revisão espaçada com lembretes,
              streak, XP e conquistas.
            </p>
          </Card>
          <Card tone="dashed" size="lg" radius="panel">
            <p className="label-mono">Pro · em breve</p>
            <p className="mt-2 font-mono text-2xl font-medium">Em breve</p>
            <p className="mt-3 text-base text-content-secondary">
              Tudo do grátis, mais o simulado por matéria e questões em três níveis de dificuldade.
            </p>
          </Card>
        </div>

        <p className="mt-6 text-base text-content-subtle">
          O pagamento ainda não está integrado: hoje não há como pagar nem cobrança automática.
        </p>
      </section>

      <section aria-labelledby="duvidas" className="mt-24">
        <h2 id="duvidas" className="text-2xl sm:text-3xl">
          Perguntas que todo mundo faz
        </h2>

        <dl className="mt-8 space-y-4">
          {faq.map(({ q, a }) => (
            <Card key={q} tone="sunken" size="lg">
              <dt className="text-base font-bold">{q}</dt>
              <dd className="mt-2 text-base text-content-secondary">{a}</dd>
            </Card>
          ))}
        </dl>
      </section>

      <section aria-labelledby="comecar" className="mt-24">
        <Card tone="bold" size="lg" radius="panel" className="sm:p-10">
          <h2 id="comecar" className="text-3xl">
            A primeira lição leva alguns minutos.
          </h2>
          <p className="mt-4 max-w-lg text-base on-bold-secondary">
            Sem cartão, sem período de teste que expira. Você abre, estuda uma lição e já responde as
            primeiras questões no cronômetro.
          </p>
          <StartLink className="btn btn-primary mt-8" />
        </Card>
      </section>
    </main>
  );
}
