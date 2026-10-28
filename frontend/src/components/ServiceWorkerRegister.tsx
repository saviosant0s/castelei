"use client";

import { useEffect } from "react";
// Carregado aqui, na abertura de qualquer página, para escutar o convite de
// instalar antes que ele passe. Ver lib/install-prompt.ts.
import "@/lib/install-prompt";
import { applyTheme, readTheme } from "@/lib/theme";

export function ServiceWorkerRegister() {
  useEffect(() => {
    /*
    | A barra de status de quem escolheu escuro ou automático. O script do
    | <head> já acertou as cores da página; a meta fica para depois de
    | hidratar, porque o React recoloca a meta original se ela for mexida
    | antes, e a página acabava com duas — uma de cada cor.
    */
    if (readTheme() !== "light") applyTheme(readTheme());

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
