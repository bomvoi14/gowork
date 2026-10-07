import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { findLineEmployee, getLinkedGoogleAccount } from "@/lib/google-sheets";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as (NonNullable<typeof session>["user"] & { lineUserId?: string }) | undefined;
  const lineUserId = user?.lineUserId || "";
  if (!user || !lineUserId) return NextResponse.json({ ok: false }, { status: 401 });

  const mapping = await findLineEmployee(lineUserId);
  if (!mapping || mapping.status !== "active") return NextResponse.json({ ok: false }, { status: 403 });

  const google = await getLinkedGoogleAccount(mapping.empId);
  return NextResponse.json({ ok: true, google: google ? { linked: true, email: google.email, name: google.name } : { linked: false } });
}
