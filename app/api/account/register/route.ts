import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import {
  createLineEmployeeMapping,
  findActiveMappingByEmpId,
  findEmployeeForRegistration,
  findLineEmployee,
} from "@/lib/google-sheets";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as ((NonNullable<typeof session>["user"]) & { lineUserId?: string }) | undefined;
    const lineUserId = user?.lineUserId || "";
    const lineName = user?.name || "";
    if (!lineUserId) return NextResponse.json({ ok: false, error: "กรุณาเข้าสู่ระบบด้วย LINE" }, { status: 401 });

    const body = await request.json();
    const empId = String(body?.empId || "").trim();
    if (!/^\d{1,12}$/.test(empId) || body?.confirmed !== true) {
      return NextResponse.json({ ok: false, error: "กรุณาตรวจสอบข้อมูลและยืนยันว่าเป็นฉัน" }, { status: 400 });
    }
    if (await findLineEmployee(lineUserId)) return NextResponse.json({ ok: false, error: "บัญชี LINE นี้ถูกลงทะเบียนแล้ว" }, { status: 409 });
    if (await findActiveMappingByEmpId(empId)) return NextResponse.json({ ok: false, error: "เลขประจำตัวนี้ผูกกับ LINE แล้ว กรุณาติดต่อผู้ดูแลระบบ" }, { status: 409 });
    const employee = await findEmployeeForRegistration(empId);
    if (!employee) return NextResponse.json({ ok: false, error: "ไม่พบเลขประจำตัวพนักงาน กรุณาตรวจสอบและแก้ไขอีกครั้ง" }, { status: 404 });
    await createLineEmployeeMapping({ empId: employee.empId, name: employee.name, lineUserId, lineName });
    return NextResponse.json({ ok: true, status: "active", employee: { empId: employee.empId, name: employee.name } });
  } catch (error) {
    console.error("Account registration failed:", error);
    const code = error instanceof Error ? error.message : "";
    if (code === "LINE_ALREADY_BOUND" || code === "EMPLOYEE_ALREADY_BOUND") {
      return NextResponse.json({ ok: false, error: "บัญชีนี้หรือเลขประจำตัวนี้ถูกลงทะเบียนแล้ว กรุณาติดต่อผู้ดูแลระบบ" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "ไม่สามารถลงทะเบียนได้ กรุณาลองใหม่" }, { status: 500 });
  }
}
