import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowRight, Check, Lightbulb, Target, BookOpen } from "lucide-react";
import { Logo } from "@/components/Logo";
import { TOKEN_COOKIE } from "@/lib/proxy";

const layers = [
  {
    icon: BookOpen,
    title: "Explicação humana",
    text: "O assunto contado como uma pessoa explicaria, sem o \"juridiquês\" do livro.",
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
    text: "Os erros mais comuns, mostrados antes de você cair neles.",
    indent: "sm:ml-20",
  },
];

export default async function Landing() {
  const loggedIn = Boolean((await cookies()).get(TOKEN_COOKIE)?.value);

  return (
    <main className="mx-auto max-w-3xl px-6 pb-20 pt-6">
      <header className="flex items-center justify-between">
        <Logo />
        <Link href={loggedIn ? "/inicio" : "/entrar"} className="btn btn-ghost min-h-11 px-4">
          {loggedIn ? "Meu início" : "Entrar"}
        </Link>
      </header>

      <section className="mt-14 sm:mt-20">
        <p className="label-mono">Estudo para provas</p>
        <h1 className="mt-4 max-w-xl text-4xl sm:text-5xl">Aprenda o assunto e a língua que a prova fala.</h1>
        <p className="mt-5 max-w-lg text-base leading-relaxed text-ink/75">
          Cada lição explica do jeito humano, mostra como o tema costuma cair e aponta as pegadinhas antes de você errar. Depois, você treina em
          modo prova, com cronômetro.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href={loggedIn ? "/inicio" : "/cadastro"} className="btn btn-primary">
            {loggedIn ? "Continuar estudando" : "Começar grátis"} <ArrowRight className="size-5" aria-hidden="true" />
          </Link>
          {!loggedIn && (
            <Link href="/entrar" className="btn btn-ghost border-2 border-ink/15">
              Já tenho conta
            </Link>
          )}
        </div>
      </section>

      <section aria-label="Exemplo de questão" className="mt-16 sm:ml-auto sm:max-w-sm">
        <div className="-rotate-1 rounded-3xl bg-white p-6 shadow-lift">
          <p className="label-mono">Questão 4 de 5 · Equações com fração</p>
          <p className="mt-3 font-display text-2xl font-bold leading-tight">Se x/3 + 2 = 6, qual é o valor de x?</p>
          <ul className="mt-4 space-y-2 text-base">
            <li className="flex items-center gap-3 rounded-xl border-2 border-ink/10 px-3 py-2"><span className="font-mono text-sm text-ink/60">A</span> 4</li>
            <li className="flex items-center gap-3 rounded-xl border-2 border-sage bg-sage-soft px-3 py-2">
              <Check className="size-4" aria-hidden="true" /> 12
            </li>
            <li className="flex items-center gap-3 rounded-xl border-2 border-ink/10 px-3 py-2"><span className="font-mono text-sm text-ink/60">C</span> 24</li>
          </ul>
          <p className="mt-4 rounded-xl bg-coral-soft px-3 py-2 text-sm">
            <strong>Pegadinha:</strong> parar em x/3 = 4 e marcar 4 é o erro clássico.
          </p>
        </div>
      </section>

      <section className="mt-20">
        <h2 className="text-2xl">Três camadas em toda lição</h2>
        <ol className="mt-6 space-y-4">
          {layers.map(({ icon: Icon, title, text, indent }, i) => (
            <li key={title} className={`flex items-start gap-4 rounded-2xl bg-paper-2 p-5 ${indent}`}>
              <span className="font-mono text-2xl font-medium text-sky">0{i + 1}</span>
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold">
                  <Icon className="size-5" aria-hidden="true" /> {title}
                </h3>
                <p className="mt-1 text-base text-ink/75">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="planos" className="mt-20">
        <h2 className="text-2xl">Comece de graça</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border-2 border-ink p-6">
            <p className="label-mono">Grátis · agora</p>
            <p className="mt-3 text-base">Todas as lições, com 5 questões de treino em cada uma, cronômetro e relatório de tempo por tópico.</p>
          </div>
          <div className="rounded-3xl border-2 border-dashed border-ink/25 p-6">
            <p className="label-mono">Plus · em breve</p>
            <p className="mt-3 text-base text-ink/75">Todas as questões de cada lição. O pagamento chega na próxima etapa do projeto.</p>
          </div>
        </div>
      </section>

      <footer className="mt-20 flex items-center justify-between border-t border-ink/10 pt-6 text-sm text-ink/60">
        <span>Castelei · MVP</span>
        <Link href="/cadastro" className="font-bold text-ink underline underline-offset-4">Criar conta</Link>
      </footer>
    </main>
  );
}
