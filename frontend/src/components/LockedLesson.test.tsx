// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { LockedLesson } from "./LockedLesson";
import type { LessonDetail } from "@/lib/types";

afterEach(cleanup);

const trancada = {
  id: 9,
  title: "Verbos",
  summary: "",
  steps: [],
  subject: { id: 1, slug: "portugues", name: "Português" },
  locked: { id: 8, title: "Substantivo e adjetivo", position: 2 },
} as unknown as LessonDetail;

describe("LockedLesson", () => {
  it("diz qual lição falta, leva até ela e oferece o Pro", () => {
    render(<LockedLesson lesson={trancada} />);

    expect(screen.getByText(/Abre quando você ler ou praticar a lição 2: Substantivo e adjetivo/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ir para a lição 2" }).getAttribute("href")).toBe("/licao/8");
    expect(screen.getByRole("link", { name: /Pro/ }).getAttribute("href")).toBe("/planos");
    expect(screen.getByRole("link", { name: "Voltar para Português" }).getAttribute("href")).toBe("/materia/portugues");
  });
});
