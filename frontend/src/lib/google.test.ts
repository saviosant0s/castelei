import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as start } from "@/app/api/auth/google/route";
import { GET as callback } from "@/app/api/auth/google/callback/route";
import { STATE_COOKIE } from "./google";
import { TOKEN_COOKIE } from "./proxy";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  process.env.API_URL = "http://api.test/api";
  process.env.GOOGLE_CLIENT_ID = "cliente-castelei";
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GOOGLE_CLIENT_ID;
});

const volta = (query: string, cookie: string) =>
  new NextRequest(`https://castelei.test/api/auth/google/callback?${query}`, { headers: { cookie } });

describe("entrar com o Google", () => {
  it("sem client_id, nem chega a ir ao Google", () => {
    delete process.env.GOOGLE_CLIENT_ID;
    const res = start(new NextRequest("https://castelei.test/api/auth/google"));

    expect(res.headers.get("location")).toBe("https://castelei.test/entrar");
  });

  it("vai ao Google com o state guardado num cookie", () => {
    const res = start(new NextRequest("https://castelei.test/api/auth/google"));
    const destino = new URL(res.headers.get("location")!);
    const state = res.cookies.get(STATE_COOKIE)?.value;

    expect(destino.host).toBe("accounts.google.com");
    expect(destino.searchParams.get("redirect_uri")).toBe("https://castelei.test/api/auth/google/callback");
    expect(state).toBeTruthy();
    expect(destino.searchParams.get("state")).toBe(state);
  });

  it("recusa a volta com state diferente e não chama a API", async () => {
    const res = await callback(volta("code=abc&state=outro", `${STATE_COOKIE}=meu`));

    expect(res.headers.get("location")).toBe("https://castelei.test/entrar?erro=google");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("entrega o código à API, com o token do visitante, e grava a sessão", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ token: "novo" }), { status: 200 }));

    const res = await callback(volta("code=abc&state=meu", `${STATE_COOKIE}=meu; ${TOKEN_COOKIE}=visitante`));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://api.test/api/auth/google");
    expect(init.headers.Authorization).toBe("Bearer visitante");
    expect(JSON.parse(init.body)).toEqual({ code: "abc", redirect_uri: "https://castelei.test/api/auth/google/callback" });
    expect(res.headers.get("location")).toBe("https://castelei.test/entrar/google");
    expect(res.cookies.get(TOKEN_COOKIE)?.value).toBe("novo");
  });

  it("API recusando vira a mensagem na tela de entrar", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: "não" }), { status: 422 }));

    const res = await callback(volta("code=abc&state=meu", `${STATE_COOKIE}=meu`));

    expect(res.headers.get("location")).toBe("https://castelei.test/entrar?erro=google");
  });
});
