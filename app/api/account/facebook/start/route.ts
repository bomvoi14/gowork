import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { findLineEmployee, getLinkedFacebookAccount } from "@/lib/google-sheets";
export const runtime = "nodejs";
export async function GET() {
  const base = process.env.NEXTAUTH_URL!;
  const session = await getServerSession(authOptions);
  const user = session?.user as (NonNullable<typeof session>["user"] & { lineUserId?: string }) | undefined;
  const lineUserId = user?.lineUserId || "";
  if (!user || !lineUserId) return NextResponse.redirect(new URL("/?skipWelcome=1", base));
  const mapping = await findLineEmployee(lineUserId);
  if (!mapping || mapping.status !== "active") return NextResponse.redirect(new URL("/?skipWelcome=1", base));
  if (await getLinkedFacebookAccount(mapping.empId)) return NextResponse.redirect(new URL("/?skipWelcome=1&account=facebook-exists", base));
  const state = randomBytes(32).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("gtd_facebook_link_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  const redirectUri = base + "/api/account/facebook/callback";
  const url = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  url.searchParams.set("client_id", process.env.FACEBOOK_CLIENT_ID!);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", "public_profile,email");
  return NextResponse.redirect(url);
}
