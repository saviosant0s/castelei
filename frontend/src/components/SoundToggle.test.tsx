// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SoundToggle } from "./SoundToggle";
import { SOUND_KEY } from "@/lib/sound";

let iniciadas: number;

beforeEach(() => {
  window.localStorage.clear();
  iniciadas = 0;

  class FakeContext {
    currentTime = 0;
    state = "running";
    resume() {
      return Promise.resolve();
    }
    createOscillator() {
      return {
        type: "",
        frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        connect: (n: unknown) => n,
        start: () => iniciadas++,
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
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const chave = () => screen.getByRole("switch", { name: "Som ao responder" });

describe("SoundToggle", () => {
  it("começa ligado", () => {
    render(<SoundToggle />);
    expect(chave().getAttribute("aria-checked")).toBe("true");
  });

  it("desligar guarda a escolha e emudece", () => {
    render(<SoundToggle />);
    fireEvent.click(chave());

    expect(window.localStorage.getItem(SOUND_KEY)).toBe("0");
    expect(chave().getAttribute("aria-checked")).toBe("false");
  });

  it("religar toca o som na hora, que é como se mostra o que foi ligado", () => {
    render(<SoundToggle />);
    fireEvent.click(chave());
    iniciadas = 0;

    fireEvent.click(chave());
    // O acerto são duas notas.
    expect(iniciadas).toBe(2);
  });

  it("desligar não toca nada", () => {
    render(<SoundToggle />);
    fireEvent.click(chave());

    expect(iniciadas).toBe(0);
  });
});
