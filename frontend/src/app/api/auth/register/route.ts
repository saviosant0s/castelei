import type { NextRequest } from "next/server";
import { authenticate } from "@/lib/proxy";

export const POST = (req: NextRequest) => authenticate(req, "register");
