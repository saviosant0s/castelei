/*
| Digital Asset Links: o arquivo que prova ao Android que este site e o app da
| Play Store são da mesma pessoa. Sem ele o app abre com a barra do navegador
| em cima — que é exatamente a cara de site que a gente está fugindo.
|
| A impressão digital vem do Google, não do keystore local: com o App Signing
| ligado (o padrão), quem assina o APK entregue ao celular é o Google. Está em
| Play Console → Configuração → Integridade do app → Certificado de assinatura
| do app → SHA-256.
|
| Ela vive em variável de ambiente porque só existe depois que o app é criado
| no Play Console, e porque muda se um dia a chave for trocada.
*/
// Lê a variável a cada pedido: trocar a impressão digital não exige rebuild.
export const dynamic = "force-dynamic";

/** Aceita as impressões separadas por vírgula (útil na fase de testes internos). */
function fingerprints(): string[] {
  return (process.env.ANDROID_CERT_FINGERPRINTS ?? "")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);
}

export function GET() {
  const certs = fingerprints();

  // Sem impressão digital não existe verificação: melhor 404 do que publicar
  // um arquivo vazio, que o Android leria como "não confere" e cacharia.
  if (certs.length === 0) {
    return new Response("Digital Asset Links ainda não configurado.", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const statements = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: process.env.ANDROID_PACKAGE_NAME ?? "br.com.castelei.app",
        sha256_cert_fingerprints: certs,
      },
    },
  ];

  return new Response(JSON.stringify(statements, null, 2), {
    headers: {
      "content-type": "application/json",
      // O Android relê de tempos em tempos; um dia de cache é o recomendado.
      "cache-control": "public, max-age=86400",
    },
  });
}
