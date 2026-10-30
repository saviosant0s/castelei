// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AppBar } from "./AppBar";
import { BottomNav } from "@/components/BottomNav";
import { comoEstou } from "@/lib/stats";

const pathname = vi.hoisted(() => ({ value: "/inicio" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.value, useRouter: () => ({ refresh: vi.fn() }) }));

afterEach(cleanup);

describe("AppBar", () => {
  it("mostra a área, os dias seguidos e o XP", () => {
    render(<AppBar bar={{ gamification: { streak: 5, studied_today: true, xp: 1340, goal: { target: 120, today: 60 }, week: [], level: { current: 7, floor: 1350, next: 1800 } }, area: { slug: "matematica", name: "Matemática" }, reviews_due: 0 }} />);

    expect(screen.getByRole("link", { name: "Estudando Matemática" }).getAttribute("href")).toBe("/area/matematica");
    expect(screen.getByLabelText("5 dias seguidos")).toBeTruthy();
    expect(screen.getByLabelText("1340 pontos de experiência, nível 7").textContent).toContain("1.340");
    expect(screen.getByRole("button", { name: "Meta do dia: 60 de 120 XP" })).toBeTruthy();
  });

  it("cada número do cabeçalho abre o seu balão", () => {
    const week = ["2026-10-25", "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31"].map((date, i) => ({
      date,
      studied: i === 1 || i === 3,
      future: i > 3,
    }));
    render(<AppBar bar={{ gamification: { streak: 2, studied_today: true, xp: 1500, goal: { target: 120, today: 60 }, week, level: { current: 7, floor: 1350, next: 1800 } }, area: null, reviews_due: 0 }} />);

    fireEvent.click(screen.getByRole("button", { name: "2 dias seguidos" }));
    expect(screen.getByRole("dialog", { name: "Dias seguidos" })).toBeTruthy();
    expect(screen.getByLabelText("segunda: estudou")).toBeTruthy();
    expect(screen.getByLabelText("terça: não estudou")).toBeTruthy();
    expect(screen.getByLabelText("sexta: ainda não chegou")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "1500 pontos de experiência, nível 7" }));
    expect(screen.getByRole("dialog", { name: "Seu nível" }).textContent).toContain("Faltam 300 XP para o nível 8");

    fireEvent.click(screen.getByRole("button", { name: "Meta do dia: 60 de 120 XP" }));
    expect(screen.getByRole("radiogroup", { name: "Meta do dia" })).toBeTruthy();
  });

  it("avisa quando ainda não estudou hoje, sem esconder o número", () => {
    render(<AppBar bar={{ gamification: { streak: 3, studied_today: false, xp: 10, goal: { target: 120, today: 0 }, week: [], level: { current: 7, floor: 1350, next: 1800 } }, area: null, reviews_due: 0 }} />);

    expect(screen.getByLabelText("3 dias seguidos, ainda não estudou hoje")).toBeTruthy();
  });

  it("sem dados (API fora), mostra só a marca", () => {
    render(<AppBar bar={null} />);

    expect(screen.getByRole("link", { name: "Início" })).toBeTruthy();
    expect(screen.queryByLabelText(/pontos de experiência/)).toBeNull();
  });

  it("não tem lupa: a busca mora no Perfil", () => {
    render(<AppBar bar={{ gamification: null, area: null, reviews_due: 0 }} />);

    expect(screen.queryByRole("link", { name: /buscar/i })).toBeNull();
  });
});

describe("BottomNav", () => {
  it("tem quatro abas, com Revisar entre Início e Progresso", () => {
    render(<BottomNav reviewsDue={0} />);

    expect(screen.getAllByRole("link").map((a) => a.textContent)).toEqual(["Início", "Revisar", "Progresso", "Perfil"]);
  });

  it("mostra quantas revisões venceram na aba Revisar", () => {
    pathname.value = "/revisar";
    render(<BottomNav reviewsDue={3} />);

    const revisar = screen.getByRole("link", { name: "Revisar, 3 vencidas" });
    expect(revisar.getAttribute("aria-current")).toBe("page");
  });

  it("a busca acende o Perfil, que é onde ela mora", () => {
    pathname.value = "/buscar";
    render(<BottomNav />);

    expect(screen.getByRole("link", { name: "Perfil" }).getAttribute("aria-current")).toBe("page");
  });
});

describe("comoEstou", () => {
  it("dá o veredito antes do número", () => {
    expect(comoEstou(90)).toBe("Você está muito bem");
    expect(comoEstou(70)).toBe("Você está bem");
    expect(comoEstou(55)).toBe("Dá para melhorar");
    expect(comoEstou(20)).toBe("Hora de revisar");
  });
});
