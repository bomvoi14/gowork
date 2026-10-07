import type { NextAuthOptions } from "next-auth";
import LineProvider from "next-auth/providers/line";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { findEmployeeByProviderAccount, findLineEmployee } from "@/lib/google-sheets";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID as string,
      clientSecret: process.env.LINE_CLIENT_SECRET as string,
    }),
    GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID as string, clientSecret: process.env.GOOGLE_CLIENT_SECRET as string }),
    FacebookProvider({ clientId: process.env.FACEBOOK_CLIENT_ID as string, clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string }),
  ],
  callbacks: {
    async signIn({ account }) {
      if (!account || account.provider === "line") return true;
      if (account.provider === "google" || account.provider === "facebook") {
        return Boolean(await findEmployeeByProviderAccount(account.provider, account.providerAccountId));
      }
      return false;
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === "line") {
        token.lineUserId =
          account.providerAccountId ||
          (profile as { sub?: string } | undefined)?.sub ||
          "";
      } else if (account?.provider === "google" || account?.provider === "facebook") {
        const employee = await findEmployeeByProviderAccount(account.provider, account.providerAccountId);
        token.lineUserId = "";
        token.employeeId = employee?.empId || "";
        token.loginProvider = account.provider;
      } else if (account?.provider === "line") {
        token.loginProvider = "line";
        const employee = token.lineUserId ? await findLineEmployee(String(token.lineUserId)) : null;
        token.employeeId = employee?.status === "active" ? employee.empId : "";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as typeof session.user & { lineUserId?: string }).lineUserId =
          typeof token.lineUserId === "string" ? token.lineUserId : "";
        (session.user as typeof session.user & { employeeId?: string }).employeeId = typeof token.employeeId === "string" ? token.employeeId : "";
        (session.user as typeof session.user & { loginProvider?: string }).loginProvider = typeof token.loginProvider === "string" ? token.loginProvider : "";
      }
      return session;
    },
  },
};
