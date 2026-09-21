import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CATALOG, SUBJECTS } from "./site-content";

/*
| O site de divulgação anuncia o catálogo de cabeça (ver site-content.ts).
| Promessa de vitrine que não corresponde ao produto é o pior tipo de bug,
| então aqui a fonte de verdade — os JSON do backend — manda.
*/
const CONTENT_DIR = path.resolve(import.meta.dirname, "../../../backend/database/seeders/content");

interface SeedLesson {
  title: string;
  questions?: unknown[];
}

interface SeedSubject {
  slug: string;
  name: string;
  lessons: SeedLesson[];
}

function seeded(): SeedSubject[] {
  return readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(readFileSync(path.join(CONTENT_DIR, file), "utf8")) as SeedSubject);
}

describe("catálogo do site público", () => {
  const backend = seeded();

  it("anuncia exatamente as matérias que existem", () => {
    expect([...SUBJECTS.map((s) => s.slug)].sort()).toEqual([...backend.map((s) => s.slug)].sort());
  });

  it("usa o mesmo nome e as mesmas lições de cada matéria", () => {
    for (const subject of SUBJECTS) {
      const real = backend.find((s) => s.slug === subject.slug);
      expect(real, `matéria ${subject.slug} não existe no conteúdo`).toBeDefined();
      expect(subject.name).toBe(real!.name);
      expect(subject.lessons).toEqual(real!.lessons.map((lesson) => lesson.title));
    }
  });

  it("não infla os números da vitrine", () => {
    const lessons = backend.flatMap((s) => s.lessons);

    expect(CATALOG.subjects).toBe(backend.length);
    expect(CATALOG.lessons).toBe(lessons.length);
    // "8 questões por lição" só pode ser dito enquanto for verdade em todas.
    for (const lesson of lessons) {
      expect(lesson.questions?.length, `lição "${lesson.title}"`).toBe(CATALOG.questionsPerLesson);
    }
    expect(CATALOG.questions).toBe(lessons.length * CATALOG.questionsPerLesson);
  });
});
