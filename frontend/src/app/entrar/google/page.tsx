"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { limparPaginasGuardadas } from "@/lib/offline";

/*
| Chegada depois de entrar com o Google. Existe só para fazer o que o login
| por senha faz no navegador: apagar as páginas guardadas para ler sem
| internet, que podiam ser de outra conta. O redirecionamento do servidor não
| tem como mexer no armazenamento do aparelho.
*/
export default function Page() {
  const router = useRouter();

  useEffect(() => {
    void limparPaginasGuardadas().then(() => {
      router.replace("/inicio");
      router.refresh();
    });
  }, [router]);

  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <p className="text-base text-content-secondary">Entrando…</p>
    </main>
  );
}
