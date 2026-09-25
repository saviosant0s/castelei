import { describe, expect, it } from "vitest";
import { Monitor, Shapes } from "lucide-react";
import { areaIcon, areaProgress, groupByArea, subjectIcon } from "@/lib/areas";
import type { Area, Subject } from "@/lib/types";

const areas: Area[] = [
  { slug: "portugues", name: "Português" },
  { slug: "matematica", name: "Matemática" },
  { slug: "biologia", name: "Biologia" },
  { slug: "informatica", name: "Informática" },
];

function materia(slug: string, area: string | null, attempts: number[] = [0]): Subject {
  return {
    slug,
    area,
    name: slug,
    lessons: attempts.map((a, i) => ({ id: i + 1, title: `L${i + 1}`, attempts: a })),
  } as unknown as Subject;
}

describe("áreas do conhecimento", () => {
  it("agrupa pela ordem da lista oficial, não pela das matérias", () => {
    const { ativas, emBreve } = groupByArea(areas, [
      materia("so", "informatica"),
      materia("redacao", "portugues"),
      materia("crase", "portugues"),
    ]);

    expect(ativas.map((a) => a.slug)).toEqual(["portugues", "informatica"]);
    expect(ativas[0].subjects.map((s) => s.slug)).toEqual(["redacao", "crase"]);
    expect(emBreve.map((a) => a.slug)).toEqual(["matematica", "biologia"]);
  });

  it("matéria sem área, ou com área desconhecida, vai para Outras no fim — nunca some", () => {
    const { ativas } = groupByArea(areas, [materia("x", null), materia("y", "alquimia"), materia("so", "informatica")]);

    expect(ativas.map((a) => a.slug)).toEqual(["informatica", "outras"]);
    expect(ativas[1].subjects).toHaveLength(2);
  });

  it("soma as lições praticadas das matérias da área", () => {
    expect(areaProgress([materia("a", "x", [1, 0, 2]), materia("b", "x", [0])])).toEqual({ practiced: 2, total: 4 });
  });

  it("matéria sem ícone próprio usa o da área", () => {
    expect(areaIcon("informatica")).toBe(Monitor);
    expect(subjectIcon({ slug: "redes", area: "informatica" })).toBe(Monitor);
    expect(subjectIcon({ slug: "redes", area: null })).toBe(Shapes);
  });
});
