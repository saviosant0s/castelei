import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const original = { ...process.env };

afterEach(() => {
  process.env = { ...original };
});

describe("assetlinks.json", () => {
  it("sem impressão digital responde 404 em vez de um arquivo vazio", async () => {
    delete process.env.ANDROID_CERT_FINGERPRINTS;

    // Um JSON vazio o Android leria como "não confere" — e aí o app abriria
    // com a barra do navegador em cima, que é o que o TWA existe para evitar.
    expect(GET().status).toBe(404);
  });

  it("monta a declaração com o pacote e a impressão digital", async () => {
    process.env.ANDROID_CERT_FINGERPRINTS = "ab:cd:ef";
    process.env.ANDROID_PACKAGE_NAME = "br.com.castelei.app";

    const body = await GET().json();

    expect(body).toHaveLength(1);
    expect(body[0].target.package_name).toBe("br.com.castelei.app");
    expect(body[0].relation).toEqual(["delegate_permission/common.handle_all_urls"]);
    // O Google compara em maiúsculas.
    expect(body[0].target.sha256_cert_fingerprints).toEqual(["AB:CD:EF"]);
  });

  it("aceita mais de uma impressão digital", async () => {
    // Na fase de testes convivem a chave do Google e a do APK assinado na mão.
    process.env.ANDROID_CERT_FINGERPRINTS = "AA:BB , CC:DD";

    const body = await GET().json();

    expect(body[0].target.sha256_cert_fingerprints).toEqual(["AA:BB", "CC:DD"]);
  });
});
