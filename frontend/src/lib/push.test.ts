import { afterEach, describe, expect, it, vi } from "vitest";
import { chaveParaBytes, explicacao, registroPronto, type PushEstado } from "@/lib/push";

afterEach(() => vi.unstubAllGlobals());

describe("chaveParaBytes", () => {
  it("converte base64 comum", () => {
    // "Oi" em base64 é "T2k=".
    expect(Array.from(chaveParaBytes("T2k="))).toEqual([79, 105]);
  });

  it("completa o preenchimento que falta", () => {
    // Sem o "=", `atob` recusaria em navegador estrito.
    expect(Array.from(chaveParaBytes("T2k"))).toEqual([79, 105]);
  });

  /* É por isso que a função existe: a chave VAPID vem em base64url. */
  it("traduz os caracteres de base64url", () => {
    const url = chaveParaBytes("-_8");
    const normal = chaveParaBytes("+/8=");

    expect(Array.from(url)).toEqual(Array.from(normal));
  });

  it("devolve bytes, não texto", () => {
    expect(chaveParaBytes("T2k=")).toBeInstanceOf(Uint8Array);
  });
});

describe("explicacao", () => {
  const estados: PushEstado[] = [
    "carregando",
    "indisponivel",
    "desligado_no_servidor",
    "negado",
    "ligado",
    "desligado",
  ];

  it("tem frase para todo estado", () => {
    for (const estado of estados) {
      expect(explicacao(estado).length).toBeGreaterThan(0);
    }
  });

  /* O app não consegue desbloquear a permissão: a frase precisa dizer onde mexer. */
  it("manda a pessoa aos ajustes quando está bloqueado", () => {
    expect(explicacao("negado")).toMatch(/ajustes do navegador/);
  });

  it("explica o caso do iPhone", () => {
    expect(explicacao("indisponivel")).toMatch(/tela de início/);
  });

  /* A promessa que sustenta a confiança: no máximo um por dia. */
  it("promete no máximo um aviso por dia", () => {
    expect(explicacao("ligado")).toMatch(/um por dia/);
    expect(explicacao("desligado")).toMatch(/um por dia/);
  });
});

describe("registroPronto", () => {
  /*
   * A razão de a função existir: `serviceWorker.ready` nunca se resolve quando
   * não há service worker ativo — não rejeita, fica pendurada. Sem prazo, a
   * tela do Perfil ficava em "Verificando…" para sempre.
   */
  it("desiste em vez de pendurar quando o service worker não vem", async () => {
    vi.stubGlobal("navigator", {
      serviceWorker: { ready: new Promise(() => {}) },
    });
    vi.stubGlobal("window", { PushManager: class {}, Notification: class {} });
    vi.stubGlobal("Notification", class {});

    const antes = Date.now();
    await expect(registroPronto(50)).resolves.toBeNull();
    expect(Date.now() - antes).toBeLessThan(2000);
  });

  it("devolve o registro quando ele chega", async () => {
    const registro = { pushManager: {} };
    vi.stubGlobal("navigator", { serviceWorker: { ready: Promise.resolve(registro) } });
    vi.stubGlobal("window", { PushManager: class {}, Notification: class {} });
    vi.stubGlobal("Notification", class {});

    await expect(registroPronto(1000)).resolves.toBe(registro);
  });

  it("nem tenta quando o navegador não suporta", async () => {
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("window", {});

    await expect(registroPronto(1000)).resolves.toBeNull();
  });
});
