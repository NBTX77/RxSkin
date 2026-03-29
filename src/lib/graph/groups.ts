import { graphFetch } from './client'
import type { M365Group, M365User } from '@/types/m365'

export async function listGroups(token: string, options?: { top?: number; filter?: string; search?: string }): Promise<{ groups: M365Group[]; nextLink?: string }> {
  const params = new URLSearchParams()
  params.set('$select', 'id,displayName,description,groupTypes,securityEnabled,mailEnabled')
  params.set('$top', String(options?.top ?? 50))
  params.set('$orderby', 'displayName')
  params.set('$count', 'true')
  if (options?.filter) params.set('$filter', options.filter)
  if (options?.search) params.set('$search', `"displayName:${options.search}"`)

  const data = await graphFetch(`/groups?${params.toString()}`, {
    token,
    headers: { 'ConsistencyLevel': 'eventual' },
  })
  return {
    groups: (data.value as unknown as M365Group[]) || [],
    nextLink: (data['@odata.nextLink'] as string) || undefined,
  }
}

export async function getGroup(token: string, groupId: string): Promise<M365Group> {
  const data = await graphFetch(`/groups/${groupId}?$select=id,displayName,description,groupTypes,securityEnabled,mailEnabled`, { token })
  return data as unknown as M365Group
}

export async function listGroupMembers(token: string, groupId: string): Promise<M365User[]> {
  const data = await graphFetch(`/groups/${groupId}/members?$select=id,displayName,userPrincipalName,mail`, { token })
  return (data.value as unknown as M365User[]) || []
}

export async function addGroupMember(token: string, groupId: string, userId: string): Promise<void> {
  await graphFetch(`/groups/${groupId}/members/$ref`, {
    token, method: 'POST',
    body: JSON.stringify({ '@odata.id': `https://graph.microsoft.com/v1.0/users/${userId}` }),
  })
}

export async function removeGroupMember(token: string, groupId: string, userId: string): Promise<void> {
  await graphFetch(`/groups/${groupId}/members/${userId}/$ref`, {
    token, method: 'DELETE',
  })
}
