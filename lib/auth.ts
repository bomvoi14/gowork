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
    async jwt({ token, account, profile }) {
      if (account?.provider === "line") {
        token.lineUserId =
          account.providerAccountId ||
          (profile as { sub?: string } | undefined)?.sub ||
          "";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as typeof session.user & { lineUserId?: string }).lineUserId =
          typeof token.lineUserId === "string" ? token.lineUserId : "";
      }
      return session;
    },
  },
};
