import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { findLineEmployee, findActiveEmployeeByEmpId } from "@/lib/google-sheets";

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
      return NextResponse.json({ ok: false, status: "unauthenticated" }, { status: 401 });
    }

    const mapping = lineUserId ? await findLineEmployee(lineUserId) : await findActiveEmployeeByEmpId(employeeId);
    if (!mapping) {
      return NextResponse.json({ ok: true, status: "unbound" });
    }

    const status = ["active", "inactive", "disabled"].includes(mapping.status)
      ? mapping.status
      : "inactive";

    return NextResponse.json({
      ok: true,
      status,
      ...(status === "active" ? { employee: { empId: mapping.empId, name: mapping.name }, role: mapping.role } : {}),
    });
  } catch (error) {
    console.error("Account status failed:", error);
    return NextResponse.json({ ok: false, status: "error" }, { status: 500 });
  }
}
