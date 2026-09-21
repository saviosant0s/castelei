import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSiteCatalog } from "./site-catalog";
import { CATALOG, SUBJECTS } from "./site-content";

const resposta = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const API = {
  subjects: [
    { slug: "sistemas-operacionais", name: "Sistemas Operacionais", description: "Do banco.", lessons: ["A", "B"] },
    { slug: "redes", name: "Redes", description: "Criada pelo painel.", lessons: ["C"] },
  ],
  totals: { subjects: 2, lessons: 3, questions: 24 },
  questions_per_lesson: 8,
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  process.env.API_URL = "http://api.test/api";
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("getSiteCatalog", () => {
  it("usa o catálogo do backend quando ele responde", async () => {
    fetchMock.mockResolvedValue(resposta(API));

    const catalogo = await getSiteCatalog();

    expect(catalogo.fallback).toBe(false);
    expect(catalogo.subjects.map((s) => s.slug)).toEqual(["sistemas-operacionais", "redes"]);
    expect(catalogo.totals.lessons).toBe(3);
  });

  /* O motivo da mudança: matéria criada no painel aparece sem ninguém editar código. */
  it("mostra matéria que só existe no banco, usando a descrição como frase", async () => {
    fetchMock.mockResolvedValue(resposta(API));

    const redes = (await getSiteCatalog()).subjects.find((s) => s.slug === "redes");

    expect(redes?.name).toBe("Redes");
    expect(redes?.pitch).toBe("Criada pelo painel.");
  });

  /* A frase de vitrine é texto de venda e não existe no banco: quem já tem a sua, mantém. */
  it("preserva a frase escrita à mão das matérias que já têm uma", async () => {
    fetchMock.mockResolvedValue(resposta(API));

    const so = (await getSiteCatalog()).subjects.find((s) => s.slug === "sistemas-operacionais");
    const escrita = SUBJECTS.find((s) => s.slug === "sistemas-operacionais")!.pitch;

    expect(so?.pitch).toBe(escrita);
    expect(so?.pitch).not.toBe("Do banco.");
  });

  it("repassa o aviso de que o número de questões não é o mesmo em toda lição", async () => {
    fetchMock.mockResolvedValue(resposta({ ...API, questions_per_lesson: null }));

    expect((await getSiteCatalog()).questionsPerLesson).toBeNull();
  });

  /*
  | A rede de segurança. A vitrine é a porta de entrada e a página que o Google
  | indexa: ela nunca pode mostrar erro nem ficar pendurada. Cada caso abaixo
  | derrubaria a página se não caísse na lista escrita à mão.
  */
  describe("cai na lista de reserva quando", () => {
    it.each([
      ["a API está fora do ar", () => fetchMock.mockRejectedValue(new Error("ECONNREFUSED"))],
      ["a API demora e o pedido é abortado", () => fetchMock.mockRejectedValue(new DOMException("timeout", "TimeoutError"))],
      ["a API responde 500", () => fetchMock.mockResolvedValue(resposta({ message: "erro" }, 500))],
      ["a resposta não é o catálogo esperado", () => fetchMock.mockResolvedValue(resposta({ qualquer: "coisa" }))],
      ["a resposta nem é JSON", () => fetchMock.mockResolvedValue(new Response("<html>502</html>"))],
      ["uma lição vem com tipo errado", () => fetchMock.mockResolvedValue(resposta({ ...API, subjects: [{ slug: "x", name: "X", lessons: [42] }] }))],
      ["o catálogo vem vazio", () => fetchMock.mockResolvedValue(resposta({ subjects: [], totals: { subjects: 0, lessons: 0, questions: 0 }, questions_per_lesson: null }))],
    ])("%s", async (_caso, preparar) => {
      preparar();

      const catalogo = await getSiteCatalog();

      expect(catalogo.fallback).toBe(true);
      expect(catalogo.subjects).toEqual(SUBJECTS);
      expect(catalogo.totals.lessons).toBe(CATALOG.lessons);
      expect(catalogo.questionsPerLesson).toBe(CATALOG.questionsPerLesson);
    });
  });

  it("não espera para sempre por um backend lento", async () => {
    fetchMock.mockResolvedValue(resposta(API));

    await getSiteCatalog();

    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });
});
