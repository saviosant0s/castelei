import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

/*
| Só as páginas públicas entram. As telas do app exigem sessão: indexá-las
| geraria resultado de busca que leva direto para a tela de login.
*/
const PUBLIC_PAGES = [
  { path: "/", priority: 1 },
  { path: "/como-funciona", priority: 0.8 },
  { path: "/materias", priority: 0.8 },
  { path: "/privacidade", priority: 0.3 },
  { path: "/excluir-conta", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();

  return PUBLIC_PAGES.map(({ path, priority }) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    priority,
  }));
}
