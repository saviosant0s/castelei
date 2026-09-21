// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ProgressTabs } from "./ProgressTabs";

const pathname = vi.hoisted(() => ({ value: "/progresso" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }));

afterEach(cleanup);

describe("ProgressTabs", () => {
  it("marca só a aba da rota atual", () => {
    pathname.value = "/progresso/evolucao";
    render(<ProgressTabs />);

    expect(screen.getByRole("link", { name: "Evolução" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Resumo" }).getAttribute("aria-current")).toBeNull();
  });

  it("no resumo não acende a aba de evolução", () => {
    // "/progresso" é prefixo das outras: comparar por prefixo acenderia duas abas.
    pathname.value = "/progresso";
    render(<ProgressTabs />);

    expect(screen.getByRole("link", { name: "Resumo" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Conquistas" }).getAttribute("aria-current")).toBeNull();
  });
});
