import type { NextRequest } from "next/server";
import { forwardToBackend } from "@/lib/proxy";

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forwardToBackend(req, path);
}
