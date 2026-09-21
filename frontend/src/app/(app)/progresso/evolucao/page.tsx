import type { Metadata } from "next";
import { EvolutionChart } from "@/components/EvolutionChart";
import { EmptyState } from "@/components/ui";
import { serverGet } from "@/lib/backend";
import type { ProgressResponse } from "@/lib/types";

export const metadata: Metadata = { title: "Evolução" };

export default async function Evolucao() {
  const { evolution } = await serverGet<ProgressResponse>("/progress");

  // Um ponto sozinho não é evolução: é um ponto.
  if (evolution.length < 2) {
    return (
      <EmptyState
        level="h2"
        title="Falta uma prática para comparar"
        description="A evolução aparece quando existem pelo menos duas práticas terminadas — aí dá para ver se o acerto subiu e se o tempo caiu."
        action={{ label: "Praticar agora", href: "/inicio" }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-base text-content-secondary">
        Suas últimas {evolution.length} práticas, da mais antiga para a mais recente. Toque num ponto para ver
        de qual prática ele é.
      </p>
      <EvolutionChart points={evolution} showHeading={false} />
    </div>
  );
}
