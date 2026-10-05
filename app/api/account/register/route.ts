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

function surnameSuffix4(englishName: string) {
  const parts = englishName.trim().split(/\s+/).filter(Boolean);
  const surname = parts.at(-1) || "";
  return surname.slice(-4).toUpperCase();
}

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
    const suffix = String(body.surnameSuffix || "").trim().toUpperCase();

    if (!/^\d+$/.test(empId) || !/^[A-Z]{4}$/.test(suffix)) {
      return NextResponse.json({ ok: false, error: "ข้อมูลยืนยันไม่ถูกต้อง" }, { status: 400 });
    }

    if (await findLineEmployee(lineUserId)) {
      return NextResponse.json({ ok: false, error: "บัญชี LINE นี้ถูกลงทะเบียนแล้ว" }, { status: 409 });
    }
    if (await findActiveMappingByEmpId(empId)) {
      return NextResponse.json({ ok: false, error: "รหัสพนักงานนี้ถูกลงทะเบียนแล้ว" }, { status: 409 });
    }

    const employee = await findEmployeeForRegistration(empId);
    if (!employee || surnameSuffix4(employee.englishName) !== suffix) {
      return NextResponse.json({ ok: false, error: "ข้อมูลยืนยันไม่ถูกต้อง" }, { status: 400 });
    }

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
    console.error("Account registration failed:", error);
    return NextResponse.json({ ok: false, error: "ไม่สามารถลงทะเบียนได้" }, { status: 500 });
  }
}
