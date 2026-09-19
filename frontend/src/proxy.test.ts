import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";
import { TOKEN_COOKIE } from "@/lib/proxy";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const visit = (cookie?: string) =>
  new NextRequest("http://localhost/inicio", { headers: cookie ? { cookie } : {} });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubEnv("API_URL", "http://api.test/api");
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("proxy (telas protegidas)", () => {
  it("deixa passar quem já tem cookie, sem chamar a API", async () => {
    vi.stubEnv("GUEST_MODE", "true");
    const res = await proxy(visit(`${TOKEN_COOKIE}=abc`));
    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("modo normal: sem cookie vai para o login", async () => {
    vi.stubEnv("GUEST_MODE", "false");
    const res = await proxy(visit());
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/entrar");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("modo de teste: sem cookie cria visitante e grava o cookie httpOnly", async () => {
    vi.stubEnv("GUEST_MODE", "true");
    fetchMock.mockResolvedValue(jsonResponse({ user: {}, token: "9|guest" }, 201));

    const res = await proxy(visit());

    expect(res.status).toBe(200);
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`${TOKEN_COOKIE}=9%7Cguest`);
    expect(cookie.toLowerCase()).toContain("httponly");
    // o cookie também vale na própria requisição, para as telas já renderizarem logadas
    expect(res.headers.get("x-middleware-request-cookie") ?? "").toContain(`${TOKEN_COOKIE}=`);
  });

  it("modo de teste: se a API falhar responde 503 (sem laço de redirecionamento)", async () => {
    vi.stubEnv("GUEST_MODE", "true");
    fetchMock.mockRejectedValue(new Error("fora do ar"));

    const res = await proxy(visit());

    expect(res.status).toBe(503);
    expect(res.headers.get("location")).toBeNull();
  });
});
