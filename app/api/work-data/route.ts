import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { findLineEmployee, readPrivateWorkData } from "@/lib/google-sheets";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as
      | ((NonNullable<typeof session>["user"]) & { lineUserId?: string })
      | undefined;
    const lineUserId = user?.lineUserId || "";

    if (!user || !lineUserId) {
      return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
    }

    const mapping = await findLineEmployee(lineUserId);
    if (!mapping || mapping.status !== "active") {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const rows = await readPrivateWorkData();
    return NextResponse.json({ ok: true, rows });
  } catch (error) {
    console.error("Private work data failed:", error);
    return NextResponse.json({ ok: false, error: "ไม่สามารถโหลดข้อมูลได้" }, { status: 500 });
  }
}
