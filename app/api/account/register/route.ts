import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { otpScript } from "@/lib/otp-script";
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
    const user = session?.user as
      | ((NonNullable<typeof session>["user"]) & { lineUserId?: string })
      | undefined;
    const lineUserId = user?.lineUserId || "";
    const lineName = user?.name || "";

    if (!user || !lineUserId) {
      return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
    }

    const body = await request.json();
    const empId = String(body.empId || "").trim();
    const code = String(body.code || "").trim();
    const action = String(body.action || "verify");

    if (!/^\d{1,12}$/.test(empId) || !["request", "verify"].includes(action) || (action === "verify" && !/^\d{6}$/.test(code))) {
      return NextResponse.json({ ok: false, error: "ข้อมูลยืนยันไม่ถูกต้อง" }, { status: 400 });
    }

    if (await findLineEmployee(lineUserId)) {
      return NextResponse.json({ ok: false, error: "บัญชี LINE นี้ถูกลงทะเบียนแล้ว" }, { status: 409 });
    }
    if (await findActiveMappingByEmpId(empId)) {
      return NextResponse.json({ ok: false, error: "รหัสพนักงานนี้ถูกลงทะเบียนแล้ว" }, { status: 409 });
    }

    const employee = await findEmployeeForRegistration(empId);
    if (!employee) {
      return NextResponse.json({ ok: false, error: "ข้อมูลยืนยันไม่ถูกต้อง" }, { status: 400 });
    }

    const otp = await otpScript(action as "request" | "verify", lineUserId, empId, action === "verify" ? code : undefined);
    if (!otp.ok) return NextResponse.json({ ok: false, error: "ไม่สามารถส่งหรือยืนยัน OTP ได้ กรุณาลองใหม่หรือติดต่อผู้ดูแลระบบ" }, { status: 400 });
    if (action === "request") return NextResponse.json({ ok: true, email: empId + "@egat.co.th" });

    await createLineEmployeeMapping({
      empId: employee.empId,
      name: employee.name,
      lineUserId,
      lineName,
    });

    return NextResponse.json({
      ok: true,
      status: "active",
      employee: { empId: employee.empId, name: employee.name },
    });
  } catch (error) {
    console.error("Account registration failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ ok: false, error: "ไม่สามารถลงทะเบียนได้" }, { status: 500 });
  }
}
