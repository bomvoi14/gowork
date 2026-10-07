import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { findLineEmployee, findActiveEmployeeByEmpId, updateEmployeeProfile } from "@/lib/google-sheets";

export const runtime = "nodejs";

export async function POST(request: Request) {
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

    const body = await request.json();
    const targetEmpId = String(body.empId || "").trim();
    const editCraft = String(body.editCraft || "").trim();
    const editPhone = String(body.editPhone || "").replace(/\D/g, "");

    if (!targetEmpId || (editPhone && editPhone.length !== 10)) {
      return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
    }

    const isAdmin = mapping.role === "admin";
    if (!isAdmin && targetEmpId !== mapping.empId) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    await updateEmployeeProfile({
      empId: targetEmpId,
      editCraft,
      editPhone,
      editedBy: user.name || mapping.name || mapping.empId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Employee profile update failed:", error);
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  }
}
