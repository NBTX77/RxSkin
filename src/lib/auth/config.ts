import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import type { UserRole } from '@/types'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      tenantId: string
      role: UserRole
      cwMemberId?: string
    }
  }
  interface User {
    id: string
    email: string
    name: string
    tenantId: string
    role: UserRole
    cwMemberId?: string
  }
  interface JWT {
    id: string
    tenantId: string
    role: UserRole
    cwMemberId?: string
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,

  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        if (
          parsed.data.email === process.env.DEV_ADMIN_EMAIL &&
          parsed.data.password === process.env.DEV_ADMIN_PASSWORD
        ) {
          return {
            id: 'dev-user-1',
            email: parsed.data.email,
            name: 'Dev Admin',
            tenantId: process.env.DEV_TENANT_ID ?? 'rx-technology',
            role: 'ADMIN' as UserRole,
            cwMemberId: process.env.DEV_CW_MEMBER_ID,
          }
        }

        return null
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,
  },

  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
        token.tenantId = user.tenantId
        token.role = user.role
        token.cwMemberId = user.cwMemberId
      }
      return token
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      session.user.id = token.id
      session.user.tenantId = token.tenantId
      session.user.role = token.role
      session.user.cwMemberId = token.cwMemberId
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
})
