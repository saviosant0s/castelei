import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Card } from "@/components/ui";
import { serverGet } from "@/lib/backend";
import type { User } from "@/lib/types";

export const metadata: Metadata = { title: "Planos" };

/*
| O corte decidido pelo Sávio: TUDO que existe hoje fica no grátis. O Pro
| ganha por cima o simulado por matéria, as questões em três níveis de
| dificuldade e criar turmas (entrar numa turma continua grátis, porque é
| assim que o curso chega a gente nova). O plano Plus saiu da vitrine: não
| havia nada que ele desse e o grátis não.
|
| A tela descreve o destino, e a cobrança ainda não existe (ver CLAUDE.md).
*/
const plans = [
  {
    key: "free",
    name: "Grátis",
    price: "R$ 0",
    items: [
      "Todas as matérias e todas as lições",
      "Todas as questões de cada lição",
      "Trilha, vocabulário e revisão espaçada",
      "Lembretes de revisão",
      "Streak, XP e conquistas",
      "Produção textual com conferência de ortografia",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "Em breve",
    items: [
      "Tudo do Grátis",
      "Simulado por matéria",
      "Questões em três níveis: fácil, média e difícil",
      "Muito mais questões por lição",
      "Criar turmas e acompanhar os alunos",
      "Abrir qualquer lição, sem seguir a ordem",
      "Correção da redação por IA, dentro do app",
    ],
  },
] as const;

export default async function Planos() {
  const { user } = await serverGet<{ user: User }>("/me");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl">Planos</h1>
        {user.unlocked_for_testing ? (
          <Card tone="sage" className="mt-3">
            <p className="text-base">
              <strong>Tudo liberado enquanto o app está em testes.</strong> Você estuda com todos os recursos
              do Pro. Os planos abaixo mostram como vai ficar depois — e quase tudo continua grátis.
            </p>
          </Card>
        ) : (
          <p className="mt-3 text-base text-content-secondary">
            Você está no plano <strong>{user.plan_label}</strong>.
          </p>
        )}
      </header>

      <div className="space-y-4">
        {plans.map((plan) => {
          // Na fase de testes ninguém tem "plano atual": todo mundo está com tudo.
          const current = !user.unlocked_for_testing && user.plan === plan.key;

          return (
            <Card
              key={plan.key}
              tone={plan.key === "pro" ? "sky" : "outline"}
              size="lg"
              radius="panel"
              aria-labelledby={`plano-${plan.key}`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 id={`plano-${plan.key}`} className="text-2xl">{plan.name}</h2>
                <p className="font-mono text-base font-medium">{plan.price}</p>
              </div>
              <ul className="mt-4 space-y-2">
                {plan.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-base">
                    <Check className="mt-0.5 size-5 shrink-0 text-sage" aria-hidden="true" /> {item}
                  </li>
                ))}
              </ul>
              {current && (
                <p className="mt-4 rounded-control bg-surface-raised px-3 py-2 text-sm font-bold">Seu plano atual</p>
              )}
              {plan.key !== "free" && !current && (
                <button type="button" disabled className="btn btn-primary mt-5 w-full">
                  O pagamento chega em breve
                </button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
