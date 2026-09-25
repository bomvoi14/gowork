import NextAuth from "next-auth"
import LineProvider from "next-auth/providers/line"

const handler = NextAuth({
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID as string,
      clientSecret: process.env.LINE_CLIENT_SECRET as string,
    }),
  ],

  callbacks: {
    async jwt({ token, account, profile }) {
      // เก็บ LINE User ID ตอน Login สำเร็จ
      if (account?.provider === "line") {
        token.lineUserId =
          account.providerAccountId ||
          (profile as any)?.sub ||
          ""
      }

      return token
    },

    async session({ session, token }) {
      // ส่ง LINE User ID ไปให้หน้า page.tsx
      if (session.user) {
        ;(session.user as any).lineUserId =
          token.lineUserId || ""
      }

      return session
    },
  },
})

export { handler as GET, handler as POST }