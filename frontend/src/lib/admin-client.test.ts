import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminFetch, ContentError } from "./admin-client";
import { ApiError } from "./client";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** Roda a chamada esperando que ela falhe, e devolve o erro já tipado. */
async function capturar(promessa: Promise<unknown>): Promise<ApiError> {
  try {
    await promessa;
    throw new Error("A chamada devia ter falhado, e não falhou.");
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return error;
  }
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("adminFetch", () => {
  it("fala com o proxy do Next, nunca com a API direto", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ subjects: [] }));

    await adminFetch("/subjects");

    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/subjects");
  });

  it("manda objeto como JSON", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await adminFetch("/subjects", { method: "POST", body: { name: "Redes" } });

    const init = fetchMock.mock.calls[0][1];
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe('{"name":"Redes"}');
  });

  /* Em FormData o navegador escreve o content-type com a fronteira entre as
     partes. Escrevê-lo aqui quebraria todo envio de arquivo. */
  it("deixa o navegador montar o cabeçalho do envio de arquivo", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }, 201));

    const form = new FormData();
    form.append("file", new Blob(["x"]), "figura.png");
    await adminFetch("/media", { method: "POST", body: form });

    const init = fetchMock.mock.calls[0][1];
    expect(init.headers["Content-Type"]).toBeUndefined();
    expect(init.body).toBe(form);
  });

  it("transforma erro de conteúdo em ContentError, com a lista de problemas", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          message: "O arquivo tem 2 problemas.",
          content_errors: [
            { path: "lessons[0].slug", message: "Campo obrigatório." },
            { path: "lessons[0].questions[3].correct_index", message: "A resposta certa não existe." },
          ],
        },
        422,
      ),
    );

    const erro = await capturar(adminFetch("/import", { method: "POST" }));

    expect(erro).toBeInstanceOf(ContentError);
    expect((erro as ContentError).issues).toHaveLength(2);
    expect((erro as ContentError).issues[1].path).toBe("lessons[0].questions[3].correct_index");
  });

  it("guarda a dica do JSON malformado", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "Não é JSON.", hint: "Copie só o JSON." }, 400));

    const erro = await capturar(adminFetch("/import", { method: "POST" }));

    expect(erro).toBeInstanceOf(ContentError);
    expect((erro as ContentError).hint).toBe("Copie só o JSON.");
  });

  it("erro comum de validação continua sendo ApiError, com os campos", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: "Inválido.", errors: { slug: ["Já está em uso."] } }, 422),
    );

    const erro = await capturar(adminFetch("/subjects", { method: "POST" }));

    expect(erro).toBeInstanceOf(ApiError);
    expect(erro).not.toBeInstanceOf(ContentError);
    expect(erro.errors.slug[0]).toBe("Já está em uso.");
  });

  it("explica a queda quando não há conexão", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));

    const erro = await capturar(adminFetch("/subjects"));

    expect(erro).toBeInstanceOf(ApiError);
    expect(erro.status).toBe(0);
  });
});
