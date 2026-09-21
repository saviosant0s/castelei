"use client";

import { useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { playSound, primeSound, setSoundOn, soundOn, subscribeSound } from "@/lib/sound";

/*
| Ligar e desligar o som da prática, no Perfil.
|
| Existe porque o app é usado em sala de aula, em ônibus e em biblioteca. Som
| sem interruptor num app de estudo é motivo para fechar o app, não para
| gostar dele.
|
| Ligar TOCA O SOM DE ACERTO na hora. É a única forma honesta de mostrar o que
| a pessoa está ligando — e, de quebra, é o gesto que libera o áudio no
| iPhone, que só permite som dentro de um toque.
*/
export function SoundToggle() {
  /*
  | `useSyncExternalStore` pelo mesmo motivo do tema e da retomada de lição: o
  | valor só existe no navegador, numa tela que o servidor também desenha. O
  | retorno do servidor é "ligado" (o padrão), então o HTML do servidor e a
  | primeira renderização combinam, e o valor de verdade entra na seguinte.
  */
  const ligado = useSyncExternalStore(subscribeSound, soundOn, () => true);

  function escolher(valor: boolean) {
    setSoundOn(valor);
    if (valor) {
      primeSound();
      playSound("acerto");
    }
  }

  return (
    <div role="radiogroup" aria-label="Som ao responder" className="flex gap-1 rounded-pill bg-surface-sunken p-1">
      {[
        { valor: true, label: "Ligado", icon: Volume2 },
        { valor: false, label: "Desligado", icon: VolumeX },
      ].map(({ valor, label, icon: Icon }) => {
        const atual = ligado === valor;

        return (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={atual}
            onClick={() => escolher(valor)}
            className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-pill px-2 text-base transition select-none ${
              atual ? "bg-surface-raised font-bold shadow-lift" : "text-content-secondary"
            }`}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
