import { redirect, unstable_rethrow } from "next/navigation";
import { AppBar } from "@/components/app/AppBar";
import { BottomNav } from "@/components/BottomNav";
import { OfflineBanner } from "@/components/offline/OfflineBanner";
import { currentUser, serverGet } from "@/lib/backend";
import { isGuestMode } from "@/lib/proxy";
import type { AppBarResponse } from "@/lib/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  /*
  | Com o modo de teste desligado, o app exige conta (pedido do Sávio). Quem
  | chega sem sessão já é barrado pelo `proxy.ts`; aqui fica o caso que o
  | cookie sozinho não mostra: uma sessão de VISITANTE que sobrou de quando o
  | modo de teste estava ligado. Ela vai para /cadastro, que transforma o
  | visitante em conta (com Google ou e-mail) sem perder o que ele estudou.
  */
  if (!isGuestMode()) {
    const user = await currentUser();
    if (user?.is_guest) redirect("/cadastro");
  }

  /*
  | O cabeçalho é o extra, a tela é o essencial: se `/me/bar` falhar, a barra
  | sai vazia e a página abre do mesmo jeito. O redirecionamento de sessão
  | vencida passa (`unstable_rethrow`), senão ninguém voltaria ao login.
  */
  let bar: AppBarResponse | null = null;
  try {
    bar = await serverGet<AppBarResponse>("/me/bar");
  } catch (error) {
    unstable_rethrow(error);
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-28" style={{ paddingTop: "calc(var(--appbar) + 1.25rem)" }}>
      <AppBar bar={bar} />
      <OfflineBanner />
      {children}
      <BottomNav reviewsDue={bar?.reviews_due ?? 0} />
    </div>
  );
}
