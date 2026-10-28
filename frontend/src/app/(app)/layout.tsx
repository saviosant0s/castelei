import { BottomNav } from "@/components/BottomNav";
import { redirect } from "next/navigation";
import { OfflineBanner } from "@/components/offline/OfflineBanner";
import { currentUser } from "@/lib/backend";
import { isGuestMode } from "@/lib/proxy";

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

  return (
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-28 pt-6">
      <OfflineBanner />
      {children}
      <BottomNav />
    </div>
  );
}
