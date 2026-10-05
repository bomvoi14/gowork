import { NextResponse } from "next/server";
import { readEmployeeMasterSample } from "@/lib/google-sheets";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await readEmployeeMasterSample();
    return NextResponse.json({
      ok: true,
      connected: true,
      sheet: "ข้อมูล_อบค.",
      rowsRead: rows.length,
    });
  } catch (error) {
    console.error("Google Sheets connection test failed:", error);
    return NextResponse.json(
      { ok: false, connected: false, error: "Google Sheets connection failed" },
      { status: 500 }
    );
  }
}
