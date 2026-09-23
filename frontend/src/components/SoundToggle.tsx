"use client";

import { useSyncExternalStore } from "react";
import { Switch } from "@/components/ui";
import { playSound, primeSound, setSoundOn, soundOn, subscribeSound } from "@/lib/sound";

/*
| Ligar e desligar o som da prática, no Perfil.
|
| Existe porque o app é usado em sala de aula, em ônibus e em biblioteca. Som
| sem interruptor num app de estudo é motivo para fechar o app, não para
| gostar dele. Era um par de botões "Ligado | Desligado"; virou interruptor
| porque liga-desliga é exatamente o que um interruptor diz sem palavras, e
| cabe na linha do ajuste em vez de ocupar uma linha inteira.
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

  return <Switch checked={ligado} onChange={escolher} label="Som ao responder" />;
}
