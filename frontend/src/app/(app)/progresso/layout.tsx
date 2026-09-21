import { ProgressTabs } from "@/components/ProgressTabs";

/*
| O progresso é grande demais para uma tela só: números, evolução no tempo e
| conquistas respondem perguntas diferentes. Cada uma vira uma rota, e o
| cabeçalho fica aqui para não piscar na troca de aba.
*/
export default function ProgressoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <header>
        <p className="label-mono">Seus números</p>
        <h1 className="mt-1 text-4xl">Progresso</h1>
      </header>
      <ProgressTabs />
      {children}
    </div>
  );
}
