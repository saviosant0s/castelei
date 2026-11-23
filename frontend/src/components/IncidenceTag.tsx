import { INCIDENCE_LABEL, type Incidence } from "@/lib/types";

/*
| O quanto um assunto cai na prova: "Cai muito", "Cai às vezes" ou "Cai pouco".
|
| Pedido do Sávio ao montar a trilha de perito ("esse assunto é bem
| importante, cai bastante"). O número vem da contagem de itens das provas
| reais, em docs/trilha-perito.md, e vale para a lição e para o passo da
| trilha.
|
| Três barrinhas de altura crescente, como o sinal do celular, e o texto ao
| lado. Não é pílula com ícone (um dos sinais de tela gerada que o app tirou):
| é texto pequeno na cor, e a forma das barras diz o nível até para quem não
| distingue as cores. Coral para o que cai muito, nunca vermelho: vermelho
| quer dizer erro.
*/
const COR: Record<Incidence, string> = {
  alta: "text-coral-deep",
  media: "text-sky-deep",
  baixa: "text-content-subtle",
};

const CHEIAS: Record<Incidence, number> = { alta: 3, media: 2, baixa: 1 };

export function IncidenceTag({ incidence, className = "" }: { incidence: Incidence; className?: string }) {
  const cheias = CHEIAS[incidence];

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${COR[incidence]} ${className}`}>
      <span className="inline-flex items-end gap-[2px]" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`w-[3px] rounded-full ${i < cheias ? "bg-current" : "bg-current opacity-25"}`}
            style={{ height: 5 + i * 3 }}
          />
        ))}
      </span>
      {INCIDENCE_LABEL[incidence]}
    </span>
  );
}
