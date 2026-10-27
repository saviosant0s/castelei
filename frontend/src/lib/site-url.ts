/*
| O endereço público do site.
|
| Serve para o que precisa de URL absoluta: sitemap, robots e as prévias de
| link (WhatsApp, Telegram, Google). Como o domínio próprio ainda não existe,
| o padrão é o endereço de produção que o próprio Vercel informa
| (`VERCEL_PROJECT_PRODUCTION_URL`, sem "https://") — e no dia da troca é uma
| variável, não um deploy de código caçando endereço espalhado pelos arquivos.
*/
const FALLBACK = "http://localhost:3000";

export function siteUrl(): string {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const raw = process.env.SITE_URL?.trim() || (vercel ? `https://${vercel}` : "");
  if (!raw) return FALLBACK;

  // Sem barra no fim: `new URL("/materias", base)` já cuida da junção.
  return raw.replace(/\/+$/, "");
}
