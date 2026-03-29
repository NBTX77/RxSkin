// ============================================================
// Tenant Credential Manager — RX Skin
// Fetches and decrypts CW API credentials for a given tenant.
// NEVER call from client components.
// ============================================================

import type { CWCredentials } from '@/lib/cw/client'

/**
 * Simple AES-256-GCM encrypt/decrypt using Node crypto.
 * In production, consider a proper secrets manager (Vault, AWS KMS).
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key || key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters')
  }
  return Buffer.from(key.slice(0, 32), 'utf-8')
}

export function encryptCredential(plaintext: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require('crypto')
  const iv = crypto.randomBytes(12)
  const key = getEncryptionKey()
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decryptCredential(ciphertext: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require('crypto')
  const data = Buffer.from(ciphertext, 'base64')
  const iv = data.slice(0, 12)
  const tag = data.slice(12, 28)
  const encrypted = data.slice(28)
  const key = getEncryptionKey()
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(encrypted) + decipher.final('utf8')
}

/**
 * Get decrypted CW credentials for a tenant.
 * TODO: Replace stub with real Prisma DB lookup.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getTenantCredentials(tenantId: string): Promise<CWCredentials> {
  // DEV STUB — replace with DB lookup:
  // const tenant = await db.tenant.findUniqueOrThrow({ where: { id: tenantId } })
  // return {
  //   baseUrl: tenant.cwBaseUrl,
  //   companyId: tenant.cwCompanyId,
  //   clientId: tenant.cwClientId,
  //   publicKey: decryptCredential(tenant.cwPublicKey),
  //   privateKey: decryptCredential(tenant.cwPrivateKey),
  // }

  // Dev fallback to env vars for Phase 0 testing
  return {
    baseUrl: process.env.CW_BASE_URL ?? '',
    companyId: process.env.CW_COMPANY_ID ?? '',
    clientId: process.env.CW_CLIENT_ID ?? '',
    publicKey: process.env.CW_PUBLIC_KEY ?? '',
    privateKey: process.env.CW_PRIVATE_KEY ?? '',
  }
}
