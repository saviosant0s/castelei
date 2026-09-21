import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

/*
| A imagem que aparece quando alguém cola o link do Castelei no WhatsApp, no
| Telegram ou numa publicação. Divulgação boa é link compartilhado, e link sem
| prévia parece link suspeito.
|
| As fontes vêm de public/fonts porque ali elas sobrevivem ao build de
| produção — node_modules não é garantido no contêiner. O formato é .woff:
| o gerador de imagem não lê .woff2.
*/
export const alt = "Castelei — aprenda o assunto e a língua que a prova fala";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function font(file: string) {
  return readFile(path.join(process.cwd(), "public", "fonts", file));
}

export default async function OpenGraphImage() {
  const [display, sans] = await Promise.all([font("bricolage-grotesque-700.woff"), font("dm-sans-400.woff")]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#1C1C2E",
          padding: 80,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 100 100">
            <rect width="100" height="100" rx="22" fill="#5BABF0" />
            <g fill="#1C1C2E">
              <rect x="12" y="36" width="20" height="48" />
              <rect x="68" y="36" width="20" height="48" />
              <rect x="30" y="48" width="40" height="36" />
              <rect x="12" y="28" width="5" height="8" />
              <rect x="20" y="28" width="4" height="8" />
              <rect x="27" y="28" width="5" height="8" />
              <rect x="68" y="28" width="5" height="8" />
              <rect x="76" y="28" width="4" height="8" />
              <rect x="83" y="28" width="5" height="8" />
              <rect x="30" y="40" width="9" height="8" />
              <rect x="45.5" y="40" width="9" height="8" />
              <rect x="61" y="40" width="9" height="8" />
              <rect x="6" y="84" width="88" height="4" />
            </g>
            <path d="M43 84V66a7 7 0 0 1 14 0v18z" fill="#5BABF0" />
            <path d="M50 22l14 5-14 5z" fill="#F4845F" />
          </svg>
          <span style={{ fontFamily: "Display", fontSize: 44, color: "#F8F9FA" }}>Castelei</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontFamily: "Display",
              fontSize: 76,
              lineHeight: 1.1,
              color: "#F8F9FA",
              letterSpacing: -2,
            }}
          >
            Aprenda o assunto e a língua
          </span>
          <span
            style={{
              fontFamily: "Display",
              fontSize: 76,
              lineHeight: 1.1,
              color: "#5BABF0",
              letterSpacing: -2,
            }}
          >
            que a prova fala.
          </span>
        </div>

        <span style={{ fontFamily: "Sans", fontSize: 30, color: "rgba(248,249,250,0.7)" }}>
          Explicação humana · Como cai na prova · Pegadinhas
        </span>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Display", data: display, weight: 700, style: "normal" },
        { name: "Sans", data: sans, weight: 400, style: "normal" },
      ],
    },
  );
}
