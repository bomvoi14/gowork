import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { appendLoginAudit } from "@/lib/google-sheets";

export const runtime = "nodejs";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as
      | ((NonNullable<typeof session>["user"]) & { lineUserId?: string })
      | undefined;
    const lineUserId = user?.lineUserId || "";

    if (!user || !lineUserId) {
      return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
    }

    await appendLoginAudit({
      lineUserId,
      lineName: user.name || "",
      lineImage: user.image || "",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Login audit failed:", error);
    return NextResponse.json({ ok: false, error: "ไม่สามารถบันทึกประวัติ Login ได้" }, { status: 500 });
  }
}
