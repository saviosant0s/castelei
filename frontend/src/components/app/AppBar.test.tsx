// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AppBar } from "./AppBar";
import { BottomNav } from "@/components/BottomNav";
import { comoEstou } from "@/lib/stats";

const pathname = vi.hoisted(() => ({ value: "/inicio" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }));

afterEach(cleanup);

describe("AppBar", () => {
  it("mostra a área, os dias seguidos e o XP", () => {
    render(<AppBar bar={{ gamification: { streak: 5, studied_today: true, xp: 1340 }, area: { slug: "matematica", name: "Matemática" }, reviews_due: 0 }} />);

    expect(screen.getByRole("link", { name: "Estudando Matemática" }).getAttribute("href")).toBe("/area/matematica");
    expect(screen.getByLabelText("5 dias seguidos")).toBeTruthy();
    expect(screen.getByLabelText("1340 pontos de experiência").textContent).toContain("1.340");
  });

  it("avisa quando ainda não estudou hoje, sem esconder o número", () => {
    render(<AppBar bar={{ gamification: { streak: 3, studied_today: false, xp: 10 }, area: null, reviews_due: 0 }} />);

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
