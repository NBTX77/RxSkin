// ============================================================
// Tenant Credential Manager — RX Skin
// Fetches and decrypts CW API credentials for a given tenant.
// NEVER call from client components.
// ============================================================

import crypto from 'crypto'
import { prisma } from '@/lib/db/prisma'
import type { CWCredentials } from '@/lib/cw/client'

/**
 * Derive a 256-bit encryption key from the ENCRYPTION_KEY env var
 * using PBKDF2 with a fixed salt. The salt is not secret — it just
 * ensures the derived key differs from the raw env var string.
 */
const PBKDF2_SALT = 'rx-skin-credential-vault-v1'
const PBKDF2_ITERATIONS = 100_000

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key || key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters')
  }
  return crypto.pbkdf2Sync(key, PBKDF2_SALT, PBKDF2_ITERATIONS, 32, 'sha256')
}

export function encryptCredential(plaintext: string): string {
  const iv = crypto.randomBytes(12)
  const key = getEncryptionKey()
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decryptCredential(ciphertext: string): string {
  const data = Buffer.from(ciphertext, 'base64')
  const iv = data.subarray(0, 12)
  const tag = data.subarray(12, 28)
  const encrypted = data.subarray(28)
  const key = getEncryptionKey()
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(encrypted) + decipher.final('utf8')
}

/**
 * Get decrypted CW credentials for a tenant.
 * Tries DB first (TenantCredential or Tenant table), falls back to env vars in development.
 */
export async function getTenantCredentials(tenantId: string): Promise<CWCredentials> {
  // Try TenantCredential table first (Credential Vault — preferred)
  try {
    const credential = await prisma.tenantCredential.findUnique({
      where: { tenantId_platform: { tenantId, platform: 'connectwise' } },
    })

    if (credential?.isActive && credential.credentials) {
      const creds = credential.credentials as Record<string, string>
      return {
        baseUrl: creds.baseUrl ?? '',
        companyId: creds.companyId ?? '',
        clientId: creds.clientId ?? '',
        publicKey: creds.publicKey ? decryptCredential(creds.publicKey) : '',
        privateKey: creds.privateKey ? decryptCredential(creds.privateKey) : '',
      }
    }
  } catch (err) {
    console.warn('[Credentials] TenantCredential lookup failed (table may not exist), falling through to env vars', err instanceof Error ? err.message : err)
  }

  // Fallback: try Tenant table (legacy — credentials stored directly on tenant row)
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    if (tenant && tenant.cwBaseUrl) {
      return {
        baseUrl: tenant.cwBaseUrl,
        companyId: tenant.cwCompanyId,
        clientId: tenant.cwClientId,
        publicKey: decryptCredential(tenant.cwPublicKey),
        privateKey: decryptCredential(tenant.cwPrivateKey),
      }
    }
  } catch (err) {
    console.warn('[Credentials] Tenant table lookup failed, falling through to env vars', err instanceof Error ? err.message : err)
  }

  // Dev fallback to env vars (Phase 1 single-tenant mode)
  if (process.env.NODE_ENV === 'development' || process.env.CW_BASE_URL) {
    return {
      baseUrl: process.env.CW_BASE_URL ?? '',
      companyId: process.env.CW_COMPANY_ID ?? '',
      clientId: process.env.CW_CLIENT_ID ?? '',
      publicKey: process.env.CW_PUBLIC_KEY ?? '',
      privateKey: process.env.CW_PRIVATE_KEY ?? '',
    }
  }

  throw new Error(`No CW credentials found for tenant ${tenantId}`)
}
