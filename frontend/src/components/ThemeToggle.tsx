"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { type Theme, applyTheme, readTheme, saveTheme, subscribeTheme } from "@/lib/theme";

/*
| Escolha do tema, no Perfil.
|
| Três opções e não um interruptor de dois estados, porque "automático" é uma
| resposta legítima e é o padrão: quem já pôs o celular no escuro não devia
| precisar repetir a escolha aqui.
|
| A escolha é do APARELHO, não da conta. Ela vive no localStorage e não vai
| para o servidor — é preferência de leitura, como a retomada da lição. Quem
| estuda no celular à noite e no computador de dia quer justamente isso.
*/
const opcoes: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "auto", label: "Automático", icon: Monitor },
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
];

export function ThemeToggle() {
  /*
  | É `useSyncExternalStore` pelo mesmo motivo de `lesson-progress.ts`: o
  | valor só existe no navegador, numa tela que o servidor também desenha. O
  | retorno do servidor é "auto", então o HTML do servidor e a primeira
  | renderização do cliente combinam, e o valor de verdade entra na
  | renderização seguinte — sem erro de hidratação.
  |
  | A cor certa já está na tela desde antes da primeira pintura (o script do
  | `<head>`); o que ajusta aqui é só qual botão aparece marcado.
  */
  const tema = useSyncExternalStore<Theme>(subscribeTheme, readTheme, () => "auto");

  function escolher(valor: Theme) {
    saveTheme(valor);
    applyTheme(valor);
  }

  return (
    <div role="radiogroup" aria-label="Tema do aplicativo" className="flex gap-1 rounded-pill bg-surface-sunken p-1">
      {opcoes.map(({ value, label, icon: Icon }) => {
        const atual = tema === value;

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={atual}
            onClick={() => escolher(value)}
            className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-pill px-2 text-sm transition select-none ${
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
