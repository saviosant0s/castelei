import { TrailMilestone } from "./TrailMilestone";
import { TrailNode } from "./TrailNode";
import { Card, ProgressBar } from "@/components/ui";
import {
  type TrailAccent,
  type TrailModule as Module,
  trailHeight,
  trailPath,
  waveX,
} from "@/lib/lesson-trail";

/*
| Um módulo da trilha: cabeçalho colorido, quanto já andou, o caminho em
| ziguezague e o marco que o fecha.
|
| O módulo que ainda não começou aparece APAGADO, NÃO ESCONDIDO. Ver o
| caminho inteiro à frente é metade do valor da tela — é o que transforma
| "faltam 22 lições" em "faltam estes cinco assuntos". Recolher o que vem
| depois devolveria a sensação de lista, só que com um toque a mais.
*/
const tons: Record<TrailAccent, "sky" | "sage" | "coral"> = {
  sky: "sky",
  sage: "sage",
  coral: "coral",
};

const traco: Record<TrailAccent, string> = {
  sky: "text-sky/45",
  sage: "text-sage/45",
  coral: "text-coral/45",
};

export function TrailModule({
  module: bloco,
  className = "",
}: {
  module: Module;
  className?: string;
}) {
  // O marco do fim é um nó como os outros para a geometria: entra na conta da
  // altura, ganha lugar na onda e o traço chega até ele.
  const total = bloco.lessons.length + 1;
  const marcoX = waveX(bloco.lessons.length);
  const height = trailHeight(total);
  const path = trailPath([...bloco.lessons.map((item) => item.x), marcoX]);

  return (
    <section
      className={className}
      aria-label={
        bloco.name ? `Módulo ${bloco.number}: ${bloco.name}` : undefined
      }
    >
      {bloco.name && (
        /*
        | O cabeçalho GRUDA NO TOPO enquanto o módulo está na tela, e é
        | trocado pelo do módulo seguinte quando ele chega.
        |
        | É `position: sticky` puro, sem ouvir rolagem nem medir nada. Cada
        | cabeçalho é o primeiro filho da `<section>` do seu módulo, então o
        | navegador já faz a troca sozinho: o de baixo empurra o de cima para
        | fora. Ouvinte de scroll aqui seria uma reimplementação pior, que
        | ainda erraria no salto de rolagem rápida.
        |
        | Duas coisas de que isso depende, e que quebram em silêncio:
        |
        | 1. NENHUM ANCESTRAL PODE TER `overflow: hidden` ou `auto`. O app
        |    escapa porque o `globals.css` usa `overflow-x: clip` — clip não
        |    cria caixa de rolagem, hidden criaria, e o cabeçalho pararia de
        |    grudar sem erro nenhum no console.
        |
        | 2. OS MÓDULOS PRECISAM SER VIZINHOS COLADOS. A folga entre eles mora
        |    no `padding` da própria seção (ver `SubjectTrail`), nunca em
        |    margem entre elas: com margem, a seção acaba antes da folga e a
        |    tela fica alguns pixels SEM cabeçalho nenhum a cada virada.
        |
        | A faixa é chapada e sangra até a borda (`-mx-5 px-5`, desfazendo o
        | respiro do layout) porque a trilha passa POR BAIXO dela. Cartão
        | solto deixaria o traço do caminho aparecer pelos cantos
        | arredondados.
        |
        | O `padding-top` é a área segura do celular: o topo da página é a
        | barra de status, e um cabeçalho colado em `top: 0` nasceria por
        | baixo do relógio.
        |
        | E ELA NÃO TEM MARGEM DE BAIXO, de propósito. A prisão de um elemento
        | grudado é a CAIXA DE CONTEÚDO do pai, e a margem do próprio elemento
        | ainda desconta dela: com `mb-6` aqui e `pb-14` na seção, o cabeçalho
        | desgrudava 80px antes do fim do módulo e o topo da tela ficava um
        | tempo sem cabeçalho nenhum. Medido, não deduzido. O respiro virou
        | `mt-6` na trilha abaixo, que é dentro da caixa de conteúdo.
        */
        <div
          className="sticky top-0 z-10 -mx-5 bg-surface px-5 pb-2"
          style={{
            paddingTop: "max(env(safe-area-inset-top, 0px), 0.5rem)",
            // O grão do fundo vai junto, senão a faixa chapada aparece como
            // um retângulo liso por cima da página texturizada.
            backgroundImage: "var(--grain)",
          }}
        >
          {/* Mais baixo que o cartão que havia aqui, e de propósito: enquanto
              grudado ele come tela o tempo todo. Duas linhas e uma barra fina
              bastam para dizer "você está no módulo 3, e ele está pela
              metade". */}
          <Card tone={tons[bloco.accent]} size="sm">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-mono text-[0.6875rem] tracking-wide text-content-subtle uppercase">
                Módulo {bloco.number}
              </p>
              {/* O número vem escrito junto: barra sozinha não diz quanto falta. */}
              <span className="font-mono text-sm font-bold text-content-secondary tabular-nums">
                {bloco.done}/{bloco.total}
              </span>
            </div>

            {/* `line-clamp-2`, nunca `truncate`: "Comunicação entre processos"
                e "Comunicação entre processos: os clássicos" viram a mesma
                reticência. */}
            <h2 className="mt-0.5 line-clamp-2 text-lg leading-tight">
              {bloco.name}
            </h2>

            <ProgressBar
              percent={bloco.percent}
              size="sm"
              tone={bloco.done === bloco.total ? "sage" : "ink"}
              label={`${bloco.done} de ${bloco.total} lições concluídas`}
              className="mt-2.5"
            />
          </Card>
        </div>
      )}

      {/*
      | O respiro do módulo mora NESTE invólucro, e isso tem duas razões.
      |
      | `mt-6`/`pb-14` ficam dentro da caixa de conteúdo da seção — que é
      | exatamente o retângulo que prende o cabeçalho grudado. Margem entre as
      | seções, ou padding NA seção, ficam fora dele: aí o cabeçalho desgruda
      | antes do fim do módulo e o topo da tela fica sem cabeçalho a cada
      | virada. Foi medido rolando a tela, não deduzido.
      |
      | E é um invólucro, não a própria div do caminho, porque aquela tem
      | altura fixa em pixels: com `box-sizing: border-box`, um `pb-14` lá
      | dentro comeria a sobra embaixo do marco em vez de somar a ela.
      */}
      <div className="mt-6 pb-14">
        {/* Apagado o bastante para dizer "você ainda não chegou aqui", claro
            o bastante para continuar legível: quem abre o app pela primeira
            vez tem a matéria inteira à frente, e um cinza forte apagaria a
            tela. */}
        <div
          className={`relative mx-auto w-full max-w-sm ${bloco.ahead ? "opacity-75" : ""}`}
          style={{ height }}
        >
          {/*
          | O caminho atrás dos nós.
          |
          | O viewBox mistura duas unidades de propósito: x vai de 0 a 100 (a
          | mesma % que posiciona os nós) e y é pixel. Com preserveAspectRatio
          | "none" o desenho estica na horizontal junto com a tela, e o traço
          | só não engorda junto por causa do vector-effect.
          */}
          {path && (
            <svg
              aria-hidden="true"
              className={`absolute inset-0 h-full w-full ${traco[bloco.accent]}`}
              viewBox={`0 0 100 ${height}`}
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d={path}
                stroke="currentColor"
                strokeWidth={4}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                strokeDasharray={bloco.ahead ? "1 10" : undefined}
              />
            </svg>
          )}

          {bloco.lessons.map((item, index) => (
            <TrailNode
              key={item.lesson.id}
              item={item}
              index={index}
              accent={bloco.accent}
            />
          ))}

          <TrailMilestone
            index={bloco.lessons.length}
            x={marcoX}
            accent={bloco.accent}
            done={bloco.done}
            total={bloco.total}
            name={bloco.name}
          />
        </div>
      </div>
    </section>
  );
}
