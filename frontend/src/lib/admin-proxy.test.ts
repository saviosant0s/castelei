import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { forwardAdmin, TOKEN_COOKIE } from "./proxy";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function request(
  path: string,
  init: { method?: string; body?: BodyInit; cookie?: string; contentType?: string } = {},
) {
  const method = init.method ?? "GET";

  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: {
      ...(init.contentType ? { "content-type": init.contentType } : {}),
      ...(init.cookie ? { cookie: init.cookie } : {}),
    },
    body: method === "GET" ? undefined : (init.body ?? "{}"),
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  process.env.API_URL = "http://api.test/api";
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("forwardAdmin", () => {
  const comSessao = { cookie: `${TOKEN_COOKIE}=abc` };

  it("recusa sem sessão e não chega a chamar a API", async () => {
    const res = await forwardAdmin(request("/api/admin/subjects"), ["subjects"]);

    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  /* O token sai do cookie httpOnly e entra no header aqui dentro: é isso que
     mantém o navegador longe da API e o token fora do alcance do JavaScript. */
  it("manda o token do cookie no header, e nunca o cookie", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ subjects: [] }));

    await forwardAdmin(request("/api/admin/subjects", comSessao), ["subjects"]);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://api.test/api/admin/subjects");
    expect(init.headers.Authorization).toBe("Bearer abc");
    expect(init.headers.cookie).toBeUndefined();
  });

  it.each(["PUT", "DELETE", "POST"])("repassa o método %s", async (method) => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await forwardAdmin(
      request("/api/admin/questions/7", { ...comSessao, method, contentType: "application/json" }),
      ["questions", "7"],
    );

    expect(fetchMock.mock.calls[0][1].method).toBe(method);
  });

  it("leva a query adiante", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ media: [] }));

    await forwardAdmin(request("/api/admin/media?kind=video", comSessao), ["media"]);

    expect(fetchMock.mock.calls[0][0]).toBe("http://api.test/api/admin/media?kind=video");
  });

  /* Num envio de arquivo o content-type carrega a fronteira entre as partes.
     Reescrevê-lo deixaria o PHP sem saber onde um arquivo termina. */
  it("repassa o content-type do envio de arquivo sem mexer", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ media: {} }, 201));

    const contentType = "multipart/form-data; boundary=----abc123";
    await forwardAdmin(
      request("/api/admin/media", { ...comSessao, method: "POST", body: "corpo", contentType }),
      ["media"],
    );

    expect(fetchMock.mock.calls[0][1].headers["Content-Type"]).toBe(contentType);
  });

  it("não manda corpo num GET", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ subjects: [] }));

    await forwardAdmin(request("/api/admin/subjects", comSessao), ["subjects"]);

    expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
  });

  it("devolve o erro de conteúdo como veio, para a tela listar os problemas", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: "1 problema.", content_errors: [{ path: "lessons[0].slug", message: "Obrigatório." }] }, 422),
    );

    const res = await forwardAdmin(
      request("/api/admin/import", { ...comSessao, method: "POST", contentType: "application/json" }),
      ["import"],
    );

    expect(res.status).toBe(422);
    expect(await res.json()).toMatchObject({ content_errors: [{ path: "lessons[0].slug" }] });
  });

  it("deixa o download do modelo passar com o nome do arquivo", async () => {
    fetchMock.mockResolvedValue(
      new Response("{}", {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "content-disposition": 'attachment; filename="modelo-conteudo.json"',
        },
      }),
    );

    const res = await forwardAdmin(request("/api/admin/import/template", comSessao), ["import", "template"]);

    expect(res.headers.get("content-disposition")).toContain("modelo-conteudo.json");
  });

  it("derruba o cookie quando a API diz que a sessão morreu", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "Unauthenticated." }, 401));

    const res = await forwardAdmin(request("/api/admin/subjects", comSessao), ["subjects"]);

    expect(res.status).toBe(401);
    expect(res.cookies.get(TOKEN_COOKIE)?.value).toBe("");
  });

  it("explica a queda quando a API não responde", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

    const res = await forwardAdmin(request("/api/admin/subjects", comSessao), ["subjects"]);

    expect(res.status).toBe(502);
  });
});
