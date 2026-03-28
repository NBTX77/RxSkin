import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'
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
  password: z.string().min(1),
})

// Phase 1 member lookup — maps @rx-tech.com emails to CW member IDs + roles
// Replace with database lookup in Phase 2
const MEMBER_MAP: Record<string, { cwMemberId: string; role: UserRole; name: string }> = {
  'tbrown@rx-tech.com': { cwMemberId: '280', role: 'ADMIN', name: 'Travis Brown' },
  // Add more team members here as needed
}

function lookupMember(email: string) {
  const key = email.toLowerCase()
  return MEMBER_MAP[key] ?? null
}

// Build providers array
const providers = []

// Microsoft Entra ID — only added when env vars are present
if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
      authorization: {
        params: {
          scope: 'openid profile email User.Read',
        },
      },
    })
  )
}

// Admin credentials provider — only active when ADMIN_EMAIL + ADMIN_PASSWORD are set in env
if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  providers.push(
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
          parsed.data.email === process.env.ADMIN_EMAIL &&
          parsed.data.password === process.env.ADMIN_PASSWORD
        ) {
          const member = lookupMember(parsed.data.email)
          return {
            id: 'admin-1',
            email: parsed.data.email,
            name: member?.name ?? 'Admin',
            tenantId: 'rx-technology',
            role: 'ADMIN' as UserRole,
            cwMemberId: member?.cwMemberId,
          }
        }

        return null
      },
    })
  )
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,

  providers,

  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,
  },

  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user, account }: any) {
      if (user) {
        token.id = user.id

        if (account?.provider === 'microsoft-entra-id') {
          const email = user.email || ''
          const member = lookupMember(email)
          token.tenantId = 'rx-technology'
          token.role = member?.role ?? ('TECHNICIAN' as UserRole)
          token.cwMemberId = member?.cwMemberId
          if (member?.name) token.name = member.name
        } else {
          token.tenantId = user.tenantId
          token.role = user.role
          token.cwMemberId = user.cwMemberId
        }
      }
      return token
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      session.user.id = token.id ?? token.sub
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
