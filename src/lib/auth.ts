import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import "next-auth/jwt"
import bcrypt from "bcryptjs"
import { timingSafeEqual } from "crypto"
import { prisma } from "@/lib/prisma"
import type { Role } from "@prisma/client"

// S4: Startup validation for critical env vars
if (process.env.NODE_ENV === "production") {
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET === "change-me-in-production") {
    throw new Error("AUTH_SECRET must be set to a secure value in production")
  }
  if (!process.env.SUPER_ADMIN_PASSWORD || process.env.SUPER_ADMIN_PASSWORD === "change-me-in-production") {
    throw new Error("SUPER_ADMIN_PASSWORD must be set in production")
  }
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username: string
      role: Role
    }
  }
  interface User {
    username: string
    role: Role
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    username: string
    role: Role
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const username = credentials.username as string
        const password = credentials.password as string

        // SUPER_ADMIN: credentials from env vars (S2: timing-safe comparison)
        const usernameMatch = timingSafeEqual(
          Buffer.from(username),
          Buffer.from(process.env.SUPER_ADMIN_USERNAME ?? "")
        )
        const passwordMatch = timingSafeEqual(
          Buffer.from(password),
          Buffer.from(process.env.SUPER_ADMIN_PASSWORD ?? "")
        )
        if (usernameMatch && passwordMatch) {
          const superAdmin = await prisma.user.upsert({
            where: { username },
            update: {},
            create: {
              username,
              hashedPassword: await bcrypt.hash(password, 12),
              role: "SUPER_ADMIN",
            },
          })
          return { id: superAdmin.id, username: superAdmin.username, role: superAdmin.role }
        }

        const user = await prisma.user.findUnique({ where: { username } })
        if (!user) return null

        const valid = await bcrypt.compare(password, user.hashedPassword)
        if (!valid) return null

        return { id: user.id, username: user.username, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.username = user.username
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      // S1: Verify user still exists in DB to handle deleted-user sessions
      const dbUser = await prisma.user.findUnique({ where: { id: token.id as string }, select: { id: true, role: true } })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!dbUser) return null as any
      session.user.id = token.id
      session.user.username = token.username
      session.user.role = dbUser.role
      return session
    },
  },
})
