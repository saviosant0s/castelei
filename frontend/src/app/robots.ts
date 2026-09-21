import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

/*
| O site de divulgação é para ser encontrado; o app, não. Bloquear as telas de
| estudo evita que a busca ofereça um link que só leva à tela de login.
*/
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/inicio", "/materia/", "/licao/", "/simulado", "/progresso", "/perfil", "/planos"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
