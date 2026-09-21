import { CastleMark } from "@/components/Logo";

/**
 * Abertura do app instalado.
 *
 * O Android mostra a tela do manifesto (fundo + ícone) e depois entrega a
 * página: é aí que aparece o branco vazio que entrega "isto é um site". Esta
 * camada repete a mesma composição da tela do sistema e sai animada, então a
 * marca não pisca — o app cresce de dentro dela.
 *
 * É CSS puro de propósito: não depende de hidratação, então some no mesmo
 * tempo num celular rápido ou lento. E nunca captura toque
 * (`pointer-events: none`), então não trava a tela se algo der errado.
 *
 * Fora do app instalado ela não existe — no navegador, esperar uma abertura
 * seria só atraso.
 */
export function AppLaunch() {
  return (
    <div className="app-launch" aria-hidden="true">
      <div className="app-launch-mark">
        <CastleMark className="size-20" />
        <p className="font-display text-3xl font-bold tracking-tight">Castelei</p>
      </div>
    </div>
  );
}
