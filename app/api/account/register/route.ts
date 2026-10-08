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
  const startedAt = Date.now();
  let phase = "session";
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

    phase = "employee_lookup";
    const employee = await findEmployeeForRegistration(empId);
    if (!employee) {
      return NextResponse.json({ ok: false, error: "ข้อมูลยืนยันไม่ถูกต้อง" }, { status: 400 });
    }

    phase = "otp_gateway";
    const otp = await otpScript(action as "request" | "verify", lineUserId, empId, action === "verify" ? code : undefined);
    if (!otp.ok) {
      const messages: Record<string, string> = {
        OTP_NOT_FOUND: "ระบบไม่พบข้อมูล OTP ที่ส่งไป กรุณารอให้หมดเวลาแล้วขอรหัสใหม่",
        OTP_STORAGE_FAILED: "ระบบจัดเก็บ OTP ขัดข้อง กรุณาติดต่อผู้ดูแลระบบ",
        OTP_EMAIL_SEND_FAILED: "ไม่สามารถส่งอีเมล OTP ได้ กรุณาลองใหม่ภายหลัง",
        OTP_EXPIRED: "OTP หมดอายุแล้ว กรุณาขอรหัสใหม่",
        OTP_LOCKED: "ลองยืนยัน OTP เกินจำนวนครั้งที่กำหนด กรุณาติดต่อผู้ดูแลระบบ",
        OTP_INVALID: "OTP ไม่ถูกต้อง กรุณาตรวจสอบรหัสล่าสุดจากอีเมล",
        INVALID_OR_EXPIRED: "OTP ไม่ถูกต้องหรือหมดอายุ กรุณาขอรหัสใหม่หากหมดเวลา",
        WAIT_BEFORE_RESEND: "กรุณารอก่อนขอ OTP ใหม่",
        REQUEST_LIMIT: "ขอ OTP เกินจำนวนครั้งที่กำหนด กรุณาลองใหม่ภายหลัง",
        BUSY: "ระบบกำลังประมวลผล กรุณาลองอีกครั้ง",
      };
      return NextResponse.json({ ok: false, error: messages[otp.error || ""] || "ไม่สามารถยืนยัน OTP ได้ กรุณาลองใหม่หรือติดต่อผู้ดูแลระบบ" }, { status: 400 });
    }
    if (action === "request") return NextResponse.json({ ok: true, email: empId + "@egat.co.th", expiresAt: otp.expiresAt || Date.now() + 180000 });

    phase = "create_mapping";
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
    console.error("Account registration failed:", { phase, durationMs: Date.now() - startedAt, error: error instanceof Error ? error.message : "Unknown error" });
    const message = phase === "otp_gateway"
      ? "ระบบยืนยัน OTP เชื่อมต่อไม่สำเร็จ กรุณารอสักครู่แล้วลองยืนยันอีกครั้ง (ไม่ต้องขอรหัสใหม่)"
      : phase === "create_mapping"
        ? "ยืนยัน OTP แล้ว แต่บันทึกบัญชีไม่สำเร็จ กรุณาติดต่อผู้ดูแลระบบ"
        : "ระบบลงทะเบียนขัดข้อง กรุณาลองใหม่หรือติดต่อผู้ดูแลระบบ";
    return NextResponse.json({ ok: false, error: message, phase }, { status: 500 });
  }
}
