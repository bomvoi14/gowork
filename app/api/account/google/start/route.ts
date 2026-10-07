import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { findLineEmployee, getLinkedGoogleAccount } from "@/lib/google-sheets";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as (NonNullable<typeof session>["user"] & { lineUserId?: string }) | undefined;
  const lineUserId = user?.lineUserId || "";
  if (!user || !lineUserId) return NextResponse.redirect(new URL("/?skipWelcome=1", process.env.NEXTAUTH_URL!));

  const mapping = await findLineEmployee(lineUserId);
  if (!mapping || mapping.status !== "active") return NextResponse.redirect(new URL("/?skipWelcome=1", process.env.NEXTAUTH_URL!));
  if (await getLinkedGoogleAccount(mapping.empId)) return NextResponse.redirect(new URL("/?skipWelcome=1&account=google-exists", process.env.NEXTAUTH_URL!));

  const state = randomBytes(32).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("gtd_google_link_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });

  const redirectUri = process.env.NEXTAUTH_URL + "/api/account/google/callback";
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  return NextResponse.redirect(url);
}
