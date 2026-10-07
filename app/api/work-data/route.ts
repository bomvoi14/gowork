import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { findLineEmployee, findActiveEmployeeByEmpId, readPrivateWorkData } from "@/lib/google-sheets";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as
      | ((NonNullable<typeof session>["user"]) & { lineUserId?: string; employeeId?: string })
      | undefined;
    const lineUserId = user?.lineUserId || "";
    const employeeId = user?.employeeId || "";

    if (!user || (!lineUserId && !employeeId)) {
      return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
    }

    const mapping = lineUserId ? await findLineEmployee(lineUserId) : await findActiveEmployeeByEmpId(employeeId);
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
