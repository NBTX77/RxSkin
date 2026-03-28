// ============================================================
// NextAuth v5 Configuration — RX Skin
// Handles authentication with JWT session containing tenantId + role.
// ============================================================

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import type { UserRole, DepartmentCode } from '@/types'

// Extend NextAuth types to include our custom fields
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      tenantId: string
      role: UserRole
      cwMemberId?: string
      department: DepartmentCode
    }
  }

  interface User {
    id: string
    email: string
    name: string
    tenantId: string
    role: UserRole
    cwMemberId?: string
    department: DepartmentCode
  }

  interface JWT {
    id: string
    tenantId: string
    role: UserRole
    cwMemberId?: string
    department: DepartmentCode
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

        // Phase 1 credentials — will be replaced by Azure AD SSO in Phase 2
        const adminEmail = process.env.ADMIN_EMAIL ?? process.env.DEV_ADMIN_EMAIL
        const adminPassword = process.env.ADMIN_PASSWORD ?? process.env.DEV_ADMIN_PASSWORD
        if (
          adminEmail &&
          adminPassword &&
          parsed.data.email === adminEmail &&
          parsed.data.password === adminPassword
        ) {
          return {
            id: 'dev-user-1',
            email: parsed.data.email,
            name: 'Travis Brown',
            tenantId: process.env.TENANT_ID ?? process.env.DEV_TENANT_ID ?? 'rx-technology',
            role: 'ADMIN' as UserRole,
            cwMemberId: process.env.CW_MEMBER_ID ?? process.env.DEV_CW_MEMBER_ID ?? 'TBrown',
            department: (process.env.DEPARTMENT as DepartmentCode) || (process.env.DEV_DEPARTMENT as DepartmentCode) || 'SI',
          }
        }

        return null
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },

  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
        token.tenantId = user.tenantId
        token.role = user.role
        token.cwMemberId = user.cwMemberId
        token.department = user.department
      }
      return token
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      session.user.id = token.id as string
      session.user.tenantId = token.tenantId as string
      session.user.role = token.role as UserRole
      session.user.cwMemberId = token.cwMemberId as string | undefined
      session.user.department = (token.department as DepartmentCode) || 'IT'
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
})
