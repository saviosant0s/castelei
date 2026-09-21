import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { Card } from "@/components/ui";
import { adminSession } from "@/lib/admin";

/*
| A guarda do painel.
|
| Fica num grupo de rota (os parênteses não entram na URL) para valer em toda
| tela do painel menos o login, que mora um nível acima.
|
| A tranca de verdade é a da API: toda rota /api/admin/... passa pelo
| middleware `admin`. Esta camada existe para a pessoa entender o que
| aconteceu em vez de receber um 403 no meio de uma tela em branco.
*/
export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const session = await adminSession();

  if (session.state === "anonima") redirect("/admin/entrar");

  if (session.state === "sem-permissao") {
    return (
      <div className="mx-auto max-w-md space-y-6 py-8">
        <h1 className="text-3xl">Esta área não é sua</h1>
        <Card tone="outline" className="space-y-3">
          <p className="text-base">
            Você entrou como <strong>{session.name}</strong> ({session.email}), e esta conta não administra o conteúdo
            do Castelei.
          </p>
          <p className="text-base text-content-secondary">
            Se era para ter acesso, peça a quem administra para liberar a sua conta. Se entrou com a conta errada, saia
            e entre de novo.
          </p>
        </Card>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/entrar"
            className="rounded-control bg-surface-bold px-5 py-3 text-base font-bold text-paper shadow-lift"
          >
            Entrar com outra conta
          </Link>
          <Link href="/inicio" className="rounded-control bg-surface-sunken px-5 py-3 text-base">
            Voltar ao app
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AdminNav />
      {children}
    </div>
  );
}
