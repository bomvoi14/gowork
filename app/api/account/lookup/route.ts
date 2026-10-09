import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { findActiveMappingByEmpId, findEmployeeForRegistration, findLineEmployee } from "@/lib/google-sheets";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as ((NonNullable<typeof session>["user"]) & { lineUserId?: string }) | undefined;
    const lineUserId = user?.lineUserId;
    if (!lineUserId) return NextResponse.json({ ok: false, error: "กรุณาเข้าสู่ระบบด้วย LINE" }, { status: 401 });
    const body = await request.json();
    const empId = String(body?.empId || "").trim();
    if (!/^\d{1,12}$/.test(empId)) return NextResponse.json({ ok: false, error: "กรุณากรอกเลขประจำตัวให้ถูกต้อง" }, { status: 400 });
    if (await findLineEmployee(lineUserId)) return NextResponse.json({ ok: false, error: "บัญชี LINE นี้ลงทะเบียนแล้ว" }, { status: 409 });
    const employee = await findEmployeeForRegistration(empId);
    if (!employee) return NextResponse.json({ ok: false, error: "ไม่พบเลขประจำตัวพนักงาน กรุณาตรวจสอบและแก้ไขเลขประจำตัวอีกครั้ง" }, { status: 404 });
    if (await findActiveMappingByEmpId(empId)) return NextResponse.json({ ok: false, error: "เลขประจำตัวนี้ผูกกับ LINE แล้ว กรุณาติดต่อผู้ดูแลระบบ" }, { status: 409 });
    return NextResponse.json({ ok: true, employee: { empId: employee.empId, name: employee.name } });
  } catch (error) {
    console.error("Employee lookup failed:", error);
    return NextResponse.json({ ok: false, error: "ไม่สามารถตรวจสอบเลขประจำตัวได้ กรุณาลองใหม่" }, { status: 500 });
  }
}
