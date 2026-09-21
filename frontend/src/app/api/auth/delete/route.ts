import type { NextRequest } from "next/server";
import { deleteAccount } from "@/lib/proxy";

export const POST = (req: NextRequest) => deleteAccount(req);
