/*
| O endereço público do site.
|
| Serve para o que precisa de URL absoluta: sitemap, robots e as prévias de
| link (WhatsApp, Telegram, Google). Como o domínio próprio ainda não existe,
| o padrão é o da Railway — e no dia da troca é uma variável, não um deploy de
| código caçando endereço espalhado pelos arquivos.
*/
const FALLBACK = "https://frontend-production-3c7da.up.railway.app";

export function siteUrl(): string {
  const raw = process.env.SITE_URL?.trim();
  if (!raw) return FALLBACK;

  // Sem barra no fim: `new URL("/materias", base)` já cuida da junção.
  return raw.replace(/\/+$/, "");
}
