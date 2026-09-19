import type { NextRequest } from "next/server";
import { logout } from "@/lib/proxy";

export const POST = (req: NextRequest) => logout(req);
