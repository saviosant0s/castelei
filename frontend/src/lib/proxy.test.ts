import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { authenticate, forwardToBackend, isAllowedPath, logout, TOKEN_COOKIE } from "./proxy";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function request(path: string, init: { body?: string; cookie?: string } = {}) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(init.cookie ? { cookie: init.cookie } : {}) },
    body: init.body ?? "{}",
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  process.env.API_URL = "http://api.test/api";
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("isAllowedPath", () => {
  it.each([
    ["lessons/3/attempts", true],
    ["attempts/12/answers", true],
    ["attempts/12/finish", true],
    ["me", false],
    ["logout", false],
    ["progress", false],
    ["lessons/abc/attempts", false],
    ["attempts/1/answers/extra", false],
    ["../login", false],
  ])("%s → %s", (path, expected) => {
    expect(isAllowedPath(path)).toBe(expected);
  });
});

describe("forwardToBackend", () => {
  it("bloqueia rotas fora da lista sem chamar a API", async () => {
    const res = await forwardToBackend(request("/api/me", { cookie: `${TOKEN_COOKIE}=abc` }), ["me"]);
    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("responde 401 sem cookie e não chama a API", async () => {
    const res = await forwardToBackend(request("/api/lessons/3/attempts"), ["lessons", "3", "attempts"]);
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("repassa método, corpo e token do cookie como Bearer", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ attempt: { id: 7 } }, 201));

    const res = await forwardToBackend(
      request("/api/lessons/3/attempts", { cookie: `${TOKEN_COOKIE}=segredo`, body: '{"a":1}' }),
      ["lessons", "3", "attempts"],
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ attempt: { id: 7 } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://api.test/api/lessons/3/attempts");
    expect(init.method).toBe("POST");
    expect(init.body).toBe('{"a":1}');
    expect(init.headers.Authorization).toBe("Bearer segredo");
  });

  it("manda {} quando o corpo vem vazio", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    await forwardToBackend(request("/api/attempts/1/finish", { cookie: `${TOKEN_COOKIE}=t`, body: "" }), ["attempts", "1", "finish"]);
    expect(fetchMock.mock.calls[0][1].body).toBe("{}");
  });

  it("apaga o cookie quando a API responde 401", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "Unauthenticated." }, 401));
    const res = await forwardToBackend(request("/api/attempts/1/finish", { cookie: `${TOKEN_COOKIE}=velho` }), ["attempts", "1", "finish"]);
    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toContain(`${TOKEN_COOKIE}=;`);
  });

  it("responde 502 quando a API está fora do ar", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));
    const res = await forwardToBackend(request("/api/attempts/1/finish", { cookie: `${TOKEN_COOKIE}=t` }), ["attempts", "1", "finish"]);
    expect(res.status).toBe(502);
  });
});

describe("authenticate", () => {
  it("guarda o token em cookie httpOnly e não o devolve no corpo", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ user: { id: 1, name: "Ana" }, token: "1|abc" }, 201));

    const res = await authenticate(request("/api/auth/register", { body: '{"name":"Ana"}' }), "register");

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ user: { id: 1, name: "Ana" } });
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`${TOKEN_COOKIE}=`);
    expect(cookie.toLowerCase()).toContain("httponly");
    expect(cookie.toLowerCase()).toContain("samesite=lax");
    expect(fetchMock.mock.calls[0][0]).toBe("http://api.test/api/register");
  });

  it("repassa erros de validação da API sem criar cookie", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "x", errors: { email: ["E-mail ou senha incorretos."] } }, 422));

    const res = await authenticate(request("/api/auth/login", { body: "{}" }), "login");

    expect(res.status).toBe(422);
    expect((await res.json()).errors.email[0]).toBe("E-mail ou senha incorretos.");
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("recusa corpo que não é JSON", async () => {
    const res = await authenticate(request("/api/auth/login", { body: "isso não é json" }), "login");
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("logout", () => {
  it("revoga na API e apaga o cookie", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    const res = await logout(request("/api/auth/logout", { cookie: `${TOKEN_COOKIE}=t` }));
    expect(fetchMock.mock.calls[0][0]).toBe("http://api.test/api/logout");
    expect(res.headers.get("set-cookie")).toContain(`${TOKEN_COOKIE}=;`);
  });

  it("apaga o cookie mesmo se a API falhar", async () => {
    fetchMock.mockRejectedValue(new Error("fora do ar"));
    const res = await logout(request("/api/auth/logout", { cookie: `${TOKEN_COOKIE}=t` }));
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain(`${TOKEN_COOKIE}=;`);
  });
});
