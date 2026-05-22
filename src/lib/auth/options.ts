import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma/client";

// Derive config type directly from NextAuth's parameter signature —
// works across all v5 beta versions without importing a named config type.
type NextAuthConfig = Parameters<typeof NextAuth>[0];

function isUserRole(value: unknown): value is UserRole {
  return value === "SUPERADMIN" || value === "ADMIN" || value === "JURY";
}

// Extracted from src/app/api/auth/[...nextauth]/route.ts.
// Auth behavior is unchanged: credentials provider, bcrypt compare,
// active-user block, JWT strategy, identical JWT/session callbacks.
const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" as const },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const username =
            typeof credentials?.username === "string" ? credentials.username : "";
          const password =
            typeof credentials?.password === "string" ? credentials.password : "";

          if (!username || !password) {
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { username },
            select: {
              id: true,
              name: true,
              username: true,
              passwordHash: true,
              role: true,
              isActive: true,
            },
          });

          if (!user || !user.isActive) {
            return null;
          }

          const passwordMatches = await bcrypt.compare(password, user.passwordHash);

          if (!passwordMatches) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.username,
            role: user.role,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.sub = user.id;

          if (isUserRole(user.role)) {
            token.role = user.role;
          }
        }

        return token;
      } catch {
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (!session.user || !token.sub || !isUserRole(token.role)) {
          return session;
        }

        session.user.id = token.sub;
        session.user.role = token.role;

        return session;
      } catch {
        return session;
      }
    },
  },
};

// Single NextAuth v5 instance. Exports:
//   handlers — used by src/app/api/auth/[...nextauth]/route.ts
//   auth     — used by src/server/core/session.ts (v5 replacement for getServerSession)
export const { handlers, auth } = NextAuth(authConfig);

// Named export for any code that needs to reference the raw config
// (e.g., future middleware usage).
export const authOptions = authConfig;
