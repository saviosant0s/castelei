import Link from "next/link";
import { Bell } from "lucide-react";
import { tituloDaFila } from "@/lib/review";

/**
 * O sininho do topo da tela inicial: a porta para `/revisar`.
 *
 * A fila de revisão morava inteira na tela inicial, entre "continue de onde
 * parou" e as matérias. Eram duas perguntas disputando a mesma tela — o que
 * eu estudo agora e o que está vencendo —, e a lista empurrava as matérias
 * para baixo da dobra. O aviso continua à vista, só que do tamanho de um
 * número: quem quer ver a fila toca, quem não quer segue para as matérias.
 *
 * O número só aparece com revisão vencida, e é coral, nunca vermelho:
 * vermelho quer dizer erro no Castelei, e revisão vencida não é erro.
 */
export function ReviewBell({ vencidas }: { vencidas: number }) {
  const rotulo = vencidas > 0 ? `Revisões: ${tituloDaFila(vencidas).toLowerCase()}` : "Revisões: nada vencido";

  return (
    <Link
      href="/revisar"
      aria-label={rotulo}
      className="relative grid size-11 shrink-0 place-items-center rounded-pill bg-surface-raised text-content shadow-lift transition hover:-translate-y-0.5"
    >
      <Bell className="size-5" aria-hidden="true" />
      {vencidas > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-pill bg-coral px-1 text-xs font-bold text-on-accent ring-2 ring-paper"
        >
          {vencidas > 9 ? "9+" : vencidas}
        </span>
      )}
    </Link>
  );
}
