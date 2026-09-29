import { describe, expect, it } from "vitest";
import { currentStep, stepOfSubject, trailView } from "@/lib/trails";
import type { Subject, Trail } from "@/lib/types";

const trail: Trail = {
  slug: "llms-do-zero",
  name: "LLMs do zero",
  description: "",
  steps: [
    { subject: "a", name: "A", why: "" },
    { subject: "b", name: "B", why: "" },
    { subject: "x", name: "X", why: "" },
    { subject: "c", name: "C", why: "" },
  ],
};

function materia(slug: string, attempts: number[]): Subject {
  return { slug, name: slug.toUpperCase() + "!", lessons: attempts.map((a, i) => ({ id: i, title: `L${i}`, attempts: a })) } as unknown as Subject;
}

describe("trilha", () => {
  it("marca feito, atual, aberto e em breve, na ordem", () => {
    const view = trailView(trail, [materia("a", [1, 1]), materia("b", [1, 0]), materia("c", [0])]);
    expect(view.map((s) => s.state)).toEqual(["done", "current", "soon", "open"]);
    expect(view[1]).toMatchObject({ practiced: 1, total: 2, nextLesson: "L1", number: 2 });
  });

  it("usa o nome da matéria que existe", () => {
    expect(trailView(trail, [materia("a", [0])])[0].name).toBe("A!");
  });

  it("o passo atual é o primeiro que existe e não terminou", () => {
    const view = trailView(trail, [materia("a", [1]), materia("c", [0])]);
    expect(currentStep(view)?.subject).toBe("c");
  });

  it("acha o passo de uma matéria", () => {
    expect(stepOfSubject([trail], "b")?.number).toBe(2);
    expect(stepOfSubject([trail], "z")).toBeNull();
  });
});
