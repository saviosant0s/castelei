import type { NextRequest } from "next/server";
import { forwardAdmin } from "@/lib/proxy";

/*
| A porta do painel de conteúdo.
|
| Repassa para /api/admin/... da API com o token que está no cookie httpOnly.
| Quem decide se a pessoa pode é a API; aqui só passa o recado.
*/
const handler = async (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) =>
  forwardAdmin(req, (await ctx.params).path);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
