import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { findLineEmployee, linkGoogleAccount } from "@/lib/google-sheets";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const base = process.env.NEXTAUTH_URL!;
  const fail = (code: string) => NextResponse.redirect(new URL("/?skipWelcome=1&account=" + code, base));
  try {
    const code = request.nextUrl.searchParams.get("code") || "";
    const state = request.nextUrl.searchParams.get("state") || "";
    const cookieStore = await cookies();
    const savedState = cookieStore.get("gtd_google_link_state")?.value || "";
    cookieStore.delete("gtd_google_link_state");
    if (!code || !state || !savedState || state !== savedState) return fail("google-state-error");

    const session = await getServerSession(authOptions);
    const user = session?.user as (NonNullable<typeof session>["user"] & { lineUserId?: string }) | undefined;
    const lineUserId = user?.lineUserId || "";
    if (!user || !lineUserId) return fail("google-session-error");

    const mapping = await findLineEmployee(lineUserId);
    if (!mapping || mapping.status !== "active") return fail("google-account-error");

    const redirectUri = base + "/api/account/google/callback";
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenResponse.ok) return fail("google-token-error");
    const tokens = await tokenResponse.json();
    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: "Bearer " + tokens.access_token },
      cache: "no-store",
    });
    if (!profileResponse.ok) return fail("google-profile-error");
    const profile = await profileResponse.json();
    if (!profile.sub || !profile.email || profile.email_verified !== true) return fail("google-profile-error");

    await linkGoogleAccount({ empId: mapping.empId, providerId: String(profile.sub), email: String(profile.email), name: String(profile.name || "") });
    return NextResponse.redirect(new URL("/?skipWelcome=1&account=google-linked", base));
  } catch (error) {
    console.error("Google account link failed:", error);
    return fail("google-link-error");
  }
}
