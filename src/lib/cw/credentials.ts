import type { CWCredentials } from './client'

/**
 * Check if ConnectWise API credentials are configured via env vars.
 * Returns null if any required field is missing — callers fall back to mock data.
 */
export function getCWCredentials(): CWCredentials | null {
  const baseUrl = process.env.CW_BASE_URL
  const companyId = process.env.CW_COMPANY_ID
  const clientId = process.env.CW_CLIENT_ID
  const publicKey = process.env.CW_PUBLIC_KEY
  const privateKey = process.env.CW_PRIVATE_KEY

  if (!baseUrl || !companyId || !clientId || !publicKey || !privateKey) {
    return null
  }

  return { baseUrl, companyId, clientId, publicKey, privateKey }
}
