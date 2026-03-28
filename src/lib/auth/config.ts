import NextAuth from 'next-auth'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'
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

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,

  providers: [
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
      authorization: {
        params: {
          scope: 'openid profile email User.Read',
        },
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
        const email = user.email || ''
        const member = lookupMember(email)
        token.tenantId = 'rx-technology'
        token.role = member?.role ?? ('TECHNICIAN' as UserRole)
        token.cwMemberId = member?.cwMemberId
        if (member?.name) token.name = member.name
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
