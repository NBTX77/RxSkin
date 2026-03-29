// ============================================================
// NextAuth v5 Configuration — RX Skin
// Handles authentication with JWT session containing tenantId + role.
// ============================================================

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import { headers } from 'next/headers'
import { parseDepartmentCode, parseUserRole } from '@/types'
import type { UserRole, DepartmentCode } from '@/types'

// ── Login Rate Limiter ───────────────────────────────────────
// In-memory sliding window: max 5 failed attempts per IP per 15 minutes.
// Resets on successful login. Cleared periodically to prevent memory leak.

const LOGIN_MAX_ATTEMPTS = 5
const LOGIN_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

const loginAttempts = new Map<string, { count: number; firstAttempt: number }>()

// Purge stale entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  loginAttempts.forEach((data, ip) => {
    if (now - data.firstAttempt > LOGIN_WINDOW_MS) {
      loginAttempts.delete(ip)
    }
  })
}, 5 * 60 * 1000).unref()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = loginAttempts.get(ip)
  if (!entry || now - entry.firstAttempt > LOGIN_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now })
    return true
  }
  entry.count++
  return entry.count <= LOGIN_MAX_ATTEMPTS
}

function clearRateLimit(ip: string): void {
  loginAttempts.delete(ip)
}

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

        // Rate limit by IP
        const headersList = await headers()
        const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
        if (!checkRateLimit(ip)) {
          throw new Error('Too many login attempts. Try again in 15 minutes.')
        }

        // Phase 1 credentials — will be replaced by Azure AD SSO in Phase 2
        const adminEmail = process.env.ADMIN_EMAIL ?? process.env.DEV_ADMIN_EMAIL
        const adminPassword = process.env.ADMIN_PASSWORD ?? process.env.DEV_ADMIN_PASSWORD
        if (
          adminEmail &&
          adminPassword &&
          parsed.data.email === adminEmail &&
          parsed.data.password === adminPassword
        ) {
          clearRateLimit(ip)
          return {
            id: 'dev-user-1',
            email: parsed.data.email,
            name: 'Travis Brown',
            tenantId: process.env.TENANT_ID ?? process.env.DEV_TENANT_ID ?? 'rx-technology',
            role: 'ADMIN' as UserRole,
            cwMemberId: process.env.CW_MEMBER_ID ?? process.env.DEV_CW_MEMBER_ID ?? 'TBrown',
            department: parseDepartmentCode(process.env.DEPARTMENT ?? process.env.DEV_DEPARTMENT, 'SI'),
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.tenantId = user.tenantId
        token.role = user.role
        token.cwMemberId = user.cwMemberId
        token.department = user.department
        token.issuedAt = Math.floor(Date.now() / 1000)
      }

      // Sliding session: refresh token if past the halfway point (4 hours)
      const SESSION_MAX_AGE = 8 * 60 * 60 // 8 hours in seconds
      const REFRESH_THRESHOLD = SESSION_MAX_AGE / 2 // 4 hours
      const issuedAt = (token.issuedAt as number) ?? 0
      const elapsed = Math.floor(Date.now() / 1000) - issuedAt

      if (issuedAt > 0 && elapsed > REFRESH_THRESHOLD) {
        token.issuedAt = Math.floor(Date.now() / 1000)
        token.exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE
      }

      return token
    },

    async session({ session, token }) {
      session.user.id = String(token.id ?? '')
      session.user.tenantId = String(token.tenantId ?? '')
      session.user.role = parseUserRole(token.role, 'VIEWER')
      session.user.cwMemberId = token.cwMemberId ? String(token.cwMemberId) : undefined
      session.user.department = parseDepartmentCode(token.department, 'IT')
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
})
