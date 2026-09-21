// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SOUND_KEY, playSound, primeSound, setSoundOn, soundOn, subscribeSound } from "./sound";

/*
| O jsdom não tem Web Audio, então o contexto é falso.
|
| Ele guarda o que foi pedido para conferirmos o que importa: quantas notas
| tocaram (duas no acerto, uma no erro) e que nada toca com o som desligado.
| O timbre em si é decisão de ouvido, não de teste.
*/
type Nota = { hz: number; glide: number | null };

let notas: Nota[];
let resumido: number;
let estado: AudioContextState;

function fingeAudio() {
  notas = [];
  resumido = 0;
  estado = "suspended";

  class FakeContext {
    currentTime = 0;
    get state() {
      return estado;
    }
    resume() {
      resumido++;
      estado = "running";

      return Promise.resolve();
    }
    createOscillator() {
      const nota: Nota = { hz: 0, glide: null };

      return {
        type: "",
        frequency: {
          setValueAtTime: (v: number) => (nota.hz = v),
          exponentialRampToValueAtTime: (v: number) => (nota.glide = v),
        },
        connect: (n: unknown) => n,
        start: () => notas.push(nota),
        stop: () => {},
      };
    }
    createGain() {
      return {
        gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        connect: (n: unknown) => n,
      };
    }
  }

  vi.stubGlobal("AudioContext", FakeContext);
}

beforeEach(() => {
  window.localStorage.clear();
  fingeAudio();
});

afterEach(() => vi.unstubAllGlobals());

describe("o interruptor", () => {
  it("vem ligado, e só o '0' desliga", () => {
    expect(soundOn()).toBe(true);

    setSoundOn(false);
    expect(window.localStorage.getItem(SOUND_KEY)).toBe("0");
    expect(soundOn()).toBe(false);
  });

  it("religar APAGA a chave em vez de gravar '1'", () => {
    // Ausente = ligado. Gravar "1" deixaria dois jeitos de dizer a mesma coisa.
    setSoundOn(false);
    setSoundOn(true);
    expect(window.localStorage.getItem(SOUND_KEY)).toBeNull();
  });

  it("avisa a própria aba, que o evento storage não alcança", () => {
    const ouvinte = vi.fn();
    const parar = subscribeSound(ouvinte);

    setSoundOn(false);
    expect(ouvinte).toHaveBeenCalledTimes(1);

    parar();
    setSoundOn(true);
    expect(ouvinte).toHaveBeenCalledTimes(1);
  });

  it("armazenamento bloqueado deixa o som ligado, sem derrubar nada", () => {
    const original = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("bloqueado");
      },
    });

    expect(soundOn()).toBe(true);
    expect(() => setSoundOn(false)).not.toThrow();

    if (original) Object.defineProperty(window, "localStorage", original);
  });
});

describe("os dois sons", () => {
  it("o acerto sobe em duas notas", () => {
    playSound("acerto");

    expect(notas).toHaveLength(2);
    expect(notas[1].hz).toBeGreaterThan(notas[0].hz);
  });

  it("o erro é uma nota só, grave, que desce", () => {
    // Erro se mostra sem gritar: nada de estridência nem de nota subindo.
    playSound("erro");

    expect(notas).toHaveLength(1);
    expect(notas[0].hz).toBeLessThan(300);
    expect(notas[0].glide).toBeLessThan(notas[0].hz);
  });

  it("desligado não toca nada", () => {
    setSoundOn(false);
    playSound("acerto");
    playSound("erro");

    expect(notas).toHaveLength(0);
  });
});

describe("a liberação no iPhone", () => {
  it("primeSound acorda o áudio suspenso", () => {
    // Precisa acontecer dentro do gesto: a resposta do servidor chega depois,
    // quando o navegador já não libera som.
    primeSound();

    expect(resumido).toBe(1);
  });

  it("não acorda nada com o som desligado", () => {
    setSoundOn(false);
    primeSound();

    expect(resumido).toBe(0);
  });

  it("navegador sem Web Audio não derruba a prática", () => {
    vi.stubGlobal("AudioContext", undefined);

    expect(() => playSound("acerto")).not.toThrow();
    expect(() => primeSound()).not.toThrow();
  });
});
