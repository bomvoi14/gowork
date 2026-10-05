import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  const lineUserId =
    (session?.user as (typeof session.user & { lineUserId?: string }) | undefined)?.lineUserId || "";

  if (!session?.user || !lineUserId) {
    return NextResponse.json({ ok: false, status: "unauthenticated" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    status: "mapping_backend_pending",
    authenticated: true,
  });
}
