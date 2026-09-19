import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { serverGet } from "@/lib/backend";
import type { User } from "@/lib/types";

export const metadata: Metadata = { title: "Planos" };

const plans = [
  { key: "free", name: "Grátis", price: "R$ 0", items: ["Todas as lições", "5 questões de treino por lição", "Modo prova com cronômetro", "Tempo e acerto por tópico"] },
  { key: "plus", name: "Plus", price: "Em breve", items: ["Tudo do Grátis", "Todas as questões de cada lição", "Streak, XP e conquistas", "Mais lições a cada atualização"] },
] as const;

export default async function Planos() {
  const { user } = await serverGet<{ user: User }>("/me");

  return (
    <div className="space-y-8">
      <Link href="/perfil" className="inline-flex min-h-11 items-center gap-2 text-base text-ink/70 hover:text-ink">
        <ArrowLeft className="size-5" aria-hidden="true" /> Perfil
      </Link>

      <header>
        <h1 className="text-4xl">Planos</h1>
        <p className="mt-3 text-base text-ink/70">Você está no plano <strong>{user.plan_label}</strong>.</p>
      </header>

      <div className="space-y-4">
        {plans.map((plan) => {
          const current = user.plan === plan.key;
          return (
            <section key={plan.key} className={`rounded-3xl p-6 ${plan.key === "plus" ? "border-2 border-sky bg-sky-soft/50" : "border-2 border-ink/15 bg-white"}`}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-2xl">{plan.name}</h2>
                <p className="font-mono text-base font-medium">{plan.price}</p>
              </div>
              <ul className="mt-4 space-y-2">
                {plan.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-base">
                    <Check className="mt-0.5 size-5 shrink-0 text-sage" aria-hidden="true" /> {item}
                  </li>
                ))}
              </ul>
              {current && <p className="mt-4 rounded-xl bg-white px-3 py-2 text-sm font-bold">Seu plano atual</p>}
              {plan.key === "plus" && !current && (
                <button type="button" disabled className="btn btn-primary mt-5 w-full">O pagamento chega em breve</button>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
