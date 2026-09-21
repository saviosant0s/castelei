// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearSpot, readSpot, saveSpot } from "./lesson-progress";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("onde a pessoa parou na lição", () => {
  it("guarda e devolve a etapa do meio da lição", () => {
    saveSpot(7, 3, 11);

    expect(window.localStorage.getItem("castelei:licao:7:etapa")).toBe("3/11");
    expect(readSpot(7)).toEqual({ step: 3, total: 11 });
  });

  it("não guarda a primeira etapa: começo não é 'onde parei'", () => {
    saveSpot(7, 0, 11);
    expect(readSpot(7)).toBeNull();
  });

  it("apaga a marca quando a pessoa chega à última etapa", () => {
    saveSpot(7, 5, 11);
    saveSpot(7, 10, 11);

    expect(readSpot(7)).toBeNull();
  });

  it("separa uma lição da outra", () => {
    saveSpot(7, 3, 11);
    saveSpot(9, 1, 4);

    expect(readSpot(7)).toEqual({ step: 3, total: 11 });
    expect(readSpot(9)).toEqual({ step: 1, total: 4 });
  });

  it("clearSpot esquece a lição", () => {
    saveSpot(7, 3, 11);
    clearSpot(7);

    expect(readSpot(7)).toBeNull();
  });

  it("descarta marca corrompida em vez de quebrar a lição", () => {
    for (const lixo of ["", "abc", "3", "3/", "/11", "-1/11", "11/11", "20/11", "1.5/11"]) {
      window.localStorage.setItem("castelei:licao:7:etapa", lixo);
      expect(readSpot(7), `entrada ${JSON.stringify(lixo)}`).toBeNull();
    }
  });

  it("sobrevive a um navegador que proíbe o armazenamento", () => {
    // Aba anônima e dados de site bloqueados lançam exceção só de tocar no
    // localStorage. A lição tem que continuar abrindo.
    const boom = () => {
      throw new Error("SecurityError");
    };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(boom);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(boom);
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(boom);

    expect(() => saveSpot(7, 3, 11)).not.toThrow();
    expect(() => clearSpot(7)).not.toThrow();
    expect(readSpot(7)).toBeNull();
  });
});
