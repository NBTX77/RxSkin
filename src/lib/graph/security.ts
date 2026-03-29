import { graphFetch } from './client'
import type { M365RiskyUser, M365SignIn, M365ConditionalAccessPolicy } from '@/types/m365'

export async function listRiskyUsers(token: string, options?: { top?: number }): Promise<{ users: M365RiskyUser[]; nextLink?: string }> {
  const top = options?.top ?? 50
  const path = `/identityProtection/riskyUsers?$top=${top}&$orderby=riskLastUpdatedDateTime desc`
  const data = await graphFetch(path, { token })
  return {
    users: (data.value as unknown as M365RiskyUser[]) || [],
    nextLink: (data['@odata.nextLink'] as string) || undefined,
  }
}

export async function listSignIns(token: string, options?: { top?: number; filter?: string }): Promise<{ signIns: M365SignIn[]; nextLink?: string }> {
  const top = options?.top ?? 50
  const params = new URLSearchParams()
  params.set('$top', String(top))
  params.set('$orderby', 'createdDateTime desc')
  if (options?.filter) params.set('$filter', options.filter)

  const path = `/auditLogs/signIns?${params.toString()}`
  const data = await graphFetch(path, { token })
  return {
    signIns: (data.value as unknown as M365SignIn[]) || [],
    nextLink: (data['@odata.nextLink'] as string) || undefined,
  }
}

export async function getUserMfaStatus(token: string, userId: string): Promise<{ methods: Record<string, unknown>[]; isMfaRegistered: boolean }> {
  const path = `/users/${userId}/authentication/methods`
  const data = await graphFetch(path, { token })
  const methods = (data.value as Record<string, unknown>[]) || []
  const isMfaRegistered = methods.some(
    (m) => (m['@odata.type'] as string) !== '#microsoft.graph.passwordAuthenticationMethod'
  )
  return { methods, isMfaRegistered }
}

export async function listConditionalAccessPolicies(token: string): Promise<M365ConditionalAccessPolicy[]> {
  const path = '/identity/conditionalAccess/policies'
  const data = await graphFetch(path, { token })
  return (data.value as unknown as M365ConditionalAccessPolicy[]) || []
}
