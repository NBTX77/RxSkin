import { graphFetch } from './client'
import type { M365License, M365UserLicense } from '@/types/m365'

export async function listSubscribedSkus(token: string): Promise<M365License[]> {
  const data = await graphFetch('/subscribedSkus', { token })
  return (data.value as unknown as M365License[]) || []
}

export async function listUserLicenses(token: string, options?: { top?: number }): Promise<{ users: M365UserLicense[]; nextLink?: string }> {
  const top = options?.top ?? 50
  const path = `/users?$select=id,displayName,userPrincipalName,assignedLicenses&$top=${top}&$filter=assignedLicenses/$count ne 0&$count=true`
  const data = await graphFetch(path, {
    token,
    headers: { 'ConsistencyLevel': 'eventual' },
  })
  return {
    users: (data.value as unknown as M365UserLicense[]) || [],
    nextLink: (data['@odata.nextLink'] as string) || undefined,
  }
}

export async function assignLicense(token: string, userId: string, skuId: string, disabledPlans?: string[]): Promise<void> {
  const path = `/users/${userId}/assignLicense`
  await graphFetch(path, {
    token,
    method: 'POST',
    body: JSON.stringify({
      addLicenses: [{ skuId, disabledPlans: disabledPlans ?? [] }],
      removeLicenses: [],
    }),
  })
}

export async function removeLicense(token: string, userId: string, skuId: string): Promise<void> {
  const path = `/users/${userId}/assignLicense`
  await graphFetch(path, {
    token,
    method: 'POST',
    body: JSON.stringify({
      addLicenses: [],
      removeLicenses: [skuId],
    }),
  })
}
