import type { Metadata, Viewport } from "next";
import "@fontsource/bricolage-grotesque/latin-700.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/jetbrains-mono/latin-500.css";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: { default: "Castelei — estude do jeito que a prova pergunta", template: "%s · Castelei" },
  description: "Aprenda o conteúdo e a linguagem da prova: explicação humana, como o assunto cai e as pegadinhas mais comuns.",
  applicationName: "Castelei",
  appleWebApp: { capable: true, title: "Castelei", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

// linha ~20
export const viewport: Viewport = {
  themeColor: "#F8F9FA",  // era #5BABF0 — agora casa com o fundo do app
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
