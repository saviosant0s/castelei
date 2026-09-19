"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { postJson } from "@/lib/client";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      className="btn btn-ghost w-full border-2 border-ink/15"
      onClick={async () => {
        setBusy(true);
        try {
          await postJson("/api/auth/logout");
        } finally {
          router.replace("/entrar");
          router.refresh();
        }
      }}
    >
      <LogOut className="size-5" aria-hidden="true" /> Sair da conta
    </button>
  );
}
