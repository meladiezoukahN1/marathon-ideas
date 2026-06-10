import { type AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null
        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
          select: { id: true, username: true, password: true, role: true },
        })
        if (!user) return null
        const ok = await bcrypt.compare(credentials.password, user.password)
        if (!ok) return null
        return {
          id: user.id,
          name: user.username,
          email: user.username,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id   = user.id
        token.role = (user as { role: string }).role as "SUPERADMIN" | "ADMIN" | "JURY"
      }
      return token
    },
    session({ session, token }) {
      session.user.id   = token.id
      session.user.role = token.role
      return session
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
}
