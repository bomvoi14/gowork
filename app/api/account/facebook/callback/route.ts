import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { findLineEmployee, linkFacebookAccount } from "@/lib/google-sheets";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const base = process.env.NEXTAUTH_URL!;
  const fail = (code: string) => NextResponse.redirect(new URL("/?skipWelcome=1&account=" + code, base));
  try {
    const code = request.nextUrl.searchParams.get("code") || "";
    const state = request.nextUrl.searchParams.get("state") || "";
    const cookieStore = await cookies();
    const savedState = cookieStore.get("gtd_facebook_link_state")?.value || "";
    cookieStore.delete("gtd_facebook_link_state");
    if (!code || !state || !savedState || state !== savedState) return fail("facebook-state-error");
    const session = await getServerSession(authOptions);
    const user = session?.user as (NonNullable<typeof session>["user"] & { lineUserId?: string }) | undefined;
    const lineUserId = user?.lineUserId || "";
    if (!user || !lineUserId) return fail("facebook-session-error");
    const mapping = await findLineEmployee(lineUserId);
    if (!mapping || mapping.status !== "active") return fail("facebook-account-error");
    const redirectUri = base + "/api/account/facebook/callback";
    const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", process.env.FACEBOOK_CLIENT_ID!);
    tokenUrl.searchParams.set("client_secret", process.env.FACEBOOK_CLIENT_SECRET!);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);
    const tokenResponse = await fetch(tokenUrl, { cache: "no-store" });
    if (!tokenResponse.ok) return fail("facebook-token-error");
    const tokens = await tokenResponse.json();
    const profileUrl = new URL("https://graph.facebook.com/me");
    profileUrl.searchParams.set("fields", "id,name");
    profileUrl.searchParams.set("access_token", String(tokens.access_token || ""));
    const profileResponse = await fetch(profileUrl, { cache: "no-store" });
    if (!profileResponse.ok) return fail("facebook-profile-error");
    const profile = await profileResponse.json();
    if (!profile.id) return fail("facebook-profile-error");
    await linkFacebookAccount({ empId: mapping.empId, providerId: String(profile.id), email: "", name: String(profile.name || "") });
    return NextResponse.redirect(new URL("/?skipWelcome=1&account=facebook-linked", base));
  } catch (error) { console.error("Facebook account link failed:", error); return fail("facebook-link-error"); }
}
