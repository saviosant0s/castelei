import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Castelei",
    short_name: "Castelei",
    description: "Estude do jeito que a prova pergunta.",
    // `id` fixo: sem ele o Android trata mudança de start_url como outro app.
    id: "/",
    start_url: "/inicio",
    scope: "/",
    display: "standalone",
    // Se um dia o navegador não suportar standalone, cai para janela — nunca para aba.
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    categories: ["education"],
    // Segurar o ícone na tela inicial abre estes atalhos, como em app nativo.
    shortcuts: [
      {
        name: "Continuar estudando",
        short_name: "Estudar",
        url: "/inicio",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Meu progresso",
        short_name: "Progresso",
        url: "/progresso",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
    background_color: "#F8F9FA",
    theme_color: "#F8F9FA",  // era #5BABF0 — afeta Android nav bar também
    lang: "pt-BR",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
