import { describe, expect, it } from "vitest";
import { firstName, formatClock, formatSeconds, optionLetter, pluralize } from "./format";

describe("formatClock", () => {
  it("formata segundos como mm:ss", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(42)).toBe("00:42");
    expect(formatClock(75)).toBe("01:15");
    expect(formatClock(3725)).toBe("62:05");
  });
  it("ignora negativos e arredonda para baixo", () => {
    expect(formatClock(-5)).toBe("00:00");
    expect(formatClock(9.9)).toBe("00:09");
  });
});

describe("formatSeconds", () => {
  it("usa segundos abaixo de 1 minuto", () => {
    expect(formatSeconds(38.4)).toBe("38s");
    expect(formatSeconds(0)).toBe("0s");
  });
  it("usa minutos a partir de 60s", () => {
    expect(formatSeconds(92)).toBe("1min 32s");
    expect(formatSeconds(120)).toBe("2min");
  });
});

describe("helpers", () => {
  it("optionLetter", () => {
    expect(optionLetter(0)).toBe("A");
    expect(optionLetter(4)).toBe("E");
  });
  it("firstName", () => {
    expect(firstName("Sávio Santos")).toBe("Sávio");
    expect(firstName("  Ana  ")).toBe("Ana");
  });
  it("pluralize", () => {
    expect(pluralize(1, "questão", "questões")).toBe("1 questão");
    expect(pluralize(5, "questão", "questões")).toBe("5 questões");
  });
});

import { formatNumber, weekdayInitial } from "./format";

describe("gamificação", () => {
  it("formatNumber usa ponto de milhar", () => {
    expect(formatNumber(1240)).toBe("1.240");
    expect(formatNumber(80)).toBe("80");
  });
  it("weekdayInitial acerta o dia da semana", () => {
    expect(weekdayInitial("2026-09-19")).toBe("S"); // sábado
    expect(weekdayInitial("2026-09-20")).toBe("D"); // domingo
    expect(weekdayInitial("2026-09-21")).toBe("S"); // segunda
    expect(weekdayInitial("2026-09-22")).toBe("T"); // terça
  });
});
