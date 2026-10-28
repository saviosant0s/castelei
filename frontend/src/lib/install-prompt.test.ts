// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { installPrompt, promptInstall, subscribeInstallPrompt } from "./install-prompt";

function convite() {
  const evento = new Event("beforeinstallprompt", { cancelable: true }) as Event & { prompt: () => Promise<void> };
  evento.prompt = vi.fn(async () => {});
  return evento;
}

describe("convite para instalar", () => {
  it("guarda o convite que chega ANTES de alguém abrir o Perfil", () => {
    const evento = convite();
    window.dispatchEvent(evento);

    // O Perfil só abre depois; o convite tem que estar esperando por ele.
    expect(installPrompt()).toBe(evento);
    expect(evento.defaultPrevented).toBe(true);
  });

  it("avisa quem está olhando e só pode ser usado uma vez", async () => {
    const ouvinte = vi.fn();
    const parar = subscribeInstallPrompt(ouvinte);
    const evento = convite();
    window.dispatchEvent(evento);

    await promptInstall();

    expect(evento.prompt).toHaveBeenCalledTimes(1);
    expect(installPrompt()).toBeNull();
    expect(ouvinte).toHaveBeenCalledTimes(2);
    parar();
  });

  it("instalado pelo menu do navegador, o convite some", () => {
    window.dispatchEvent(convite());
    window.dispatchEvent(new Event("appinstalled"));

    expect(installPrompt()).toBeNull();
  });
});
