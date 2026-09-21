import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { Card } from "@/components/ui";
import { adminSession } from "@/lib/admin";

export const metadata: Metadata = { title: "Entrar" };

export default async function EntrarNoPainel() {
  // Quem já entrou não precisa da tela de novo.
  if ((await adminSession()).state === "ok") redirect("/admin");

  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl">Painel de conteúdo</h1>
        <p className="text-base text-content-secondary">
          Entre com a conta que administra o conteúdo do Castelei.
        </p>
      </header>

      <Card>
        <AdminLoginForm />
      </Card>
    </div>
  );
}
