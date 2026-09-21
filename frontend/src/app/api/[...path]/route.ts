import type { NextRequest } from "next/server";
import { forwardToBackend } from "@/lib/proxy";

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forwardToBackend(req, path);
}

/*
| GET e DELETE existem para os lembretes: o interruptor do Perfil lê a chave
| pública e desliga a assinatura deste aparelho. Quem decide o que passa
| continua sendo `isAllowedPath` — abrir um método não abre rota nenhuma.
*/
export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forwardToBackend(req, path);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forwardToBackend(req, path);
}
