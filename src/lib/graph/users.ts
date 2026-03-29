import { graphFetch } from './client'
import type { M365User } from '@/types/m365'

export async function listUsers(token: string, options?: { top?: number; filter?: string; search?: string; skipToken?: string }): Promise<{ users: M365User[]; nextLink?: string }> {
  const params = new URLSearchParams()
  params.set('$select', 'id,displayName,userPrincipalName,mail,jobTitle,department,accountEnabled,createdDateTime,assignedLicenses')
  params.set('$top', String(options?.top ?? 50))
  params.set('$orderby', 'displayName')
  if (options?.filter) params.set('$filter', options.filter)
  if (options?.search) params.set('$search', `"displayName:${options.search}" OR "mail:${options.search}"`)

  const headers: Record<string, string> = {}
  if (options?.search) headers['ConsistencyLevel'] = 'eventual'

  const path = `/users?${params.toString()}`
  const data = await graphFetch(path, { token, headers })
  return {
    users: (data.value as unknown as M365User[]) || [],
    nextLink: (data['@odata.nextLink'] as string) || undefined,
  }
}

export async function getUser(token: string, userId: string): Promise<M365User> {
  const params = new URLSearchParams()
  params.set('$select', 'id,displayName,userPrincipalName,mail,jobTitle,department,accountEnabled,createdDateTime,assignedLicenses')
  const data = await graphFetch(`/users/${userId}?${params.toString()}`, { token })
  return data as unknown as M365User
}

export async function createUser(token: string, userData: {
  displayName: string; userPrincipalName: string; mailNickname: string;
  password: string; forceChangePasswordNextSignIn?: boolean;
  jobTitle?: string; department?: string;
}): Promise<M365User> {
  const body = {
    displayName: userData.displayName,
    userPrincipalName: userData.userPrincipalName,
    mailNickname: userData.mailNickname,
    accountEnabled: true,
    passwordProfile: {
      password: userData.password,
      forceChangePasswordNextSignIn: userData.forceChangePasswordNextSignIn ?? true,
    },
    ...(userData.jobTitle && { jobTitle: userData.jobTitle }),
    ...(userData.department && { department: userData.department }),
  }
  const data = await graphFetch('/users', {
    token, method: 'POST', body: JSON.stringify(body),
  })
  return data as unknown as M365User
}

export async function updateUser(token: string, userId: string, updates: {
  accountEnabled?: boolean; jobTitle?: string; department?: string; displayName?: string;
}): Promise<void> {
  await graphFetch(`/users/${userId}`, {
    token, method: 'PATCH', body: JSON.stringify(updates),
  })
}

export async function resetPassword(token: string, userId: string, newPassword?: string): Promise<string> {
  const password = newPassword || generateTempPassword()
  await graphFetch(`/users/${userId}`, {
    token, method: 'PATCH',
    body: JSON.stringify({
      passwordProfile: { password, forceChangePasswordNextSignIn: true },
    }),
  })
  return password
}

export async function listAuthMethods(token: string, userId: string): Promise<Record<string, unknown>[]> {
  const data = await graphFetch(`/users/${userId}/authentication/methods`, { token })
  return (data.value as Record<string, unknown>[]) || []
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  let password = ''
  for (let i = 0; i < 16; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  return password
}
