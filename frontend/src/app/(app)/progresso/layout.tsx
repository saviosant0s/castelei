import { ProgressTabs } from "@/components/ProgressTabs";
import { PageHero } from "@/components/ui";

/*
| O progresso é grande demais para uma tela só: números, evolução no tempo e
| conquistas respondem perguntas diferentes. Cada uma vira uma rota, e o
| cabeçalho fica aqui para não piscar na troca de aba.
*/
export default function ProgressoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <PageHero eyebrow="Seus números" title="Progresso" />
      <ProgressTabs />
      {children}
    </div>
  );
}
