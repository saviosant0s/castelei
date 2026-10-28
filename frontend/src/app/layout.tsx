import type { Metadata, Viewport } from "next";
import "@fontsource/bricolage-grotesque/latin-700.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/jetbrains-mono/latin-500.css";
import "./globals.css";
import { AppLaunch } from "@/components/AppLaunch";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { siteUrl } from "@/lib/site-url";
import { THEME_COLOR, THEME_SCRIPT } from "@/lib/theme";

const TITLE = "Castelei — estude do jeito que a prova pergunta";
const DESCRIPTION =
  "Aprenda o conteúdo e a linguagem da prova: explicação humana, como o assunto cai e as pegadinhas mais comuns.";

export const metadata: Metadata = {
  // Base absoluta: sem ela, a prévia de link no WhatsApp fica sem imagem.
  metadataBase: new URL(siteUrl()),
  title: { default: TITLE, template: "%s · Castelei" },
  description: DESCRIPTION,
  applicationName: "Castelei",
  appleWebApp: { capable: true, title: "Castelei", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Castelei",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export const viewport: Viewport = {
  // A barra de status casa com o fundo do app. O padrão é claro em qualquer
  // aparelho; quem escolheu escuro ou automático tem a cor reescrita pelo
  // script do <head> e por `applyTheme` (lib/theme.ts).
  themeColor: THEME_COLOR.light,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="light" suppressHydrationWarning>
      <head>
        {/*
          Antes da primeira pintura, senão quem pediu escuro vê a tela clara
          piscar. É o único script embutido do app — ver lib/theme.ts.
        */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        {children}
        <AppLaunch />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
