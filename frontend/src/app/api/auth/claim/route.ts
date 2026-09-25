import type { NextRequest } from "next/server";
import { claimAccount } from "@/lib/proxy";

export const POST = (req: NextRequest) => claimAccount(req);
