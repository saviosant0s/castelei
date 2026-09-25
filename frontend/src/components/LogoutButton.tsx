"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { SettingsRow } from "@/components/ui";
import { postJson } from "@/lib/client";
import { limparPaginasGuardadas } from "@/lib/offline";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <SettingsRow
      icon={LogOut}
      title={busy ? "Saindo…" : "Sair da conta"}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await postJson("/api/auth/logout");
          // As páginas guardadas têm o progresso desta conta: não ficam para o próximo.
          await limparPaginasGuardadas();
        } finally {
          router.replace("/entrar");
          router.refresh();
        }
      }}
    />
  );
}
