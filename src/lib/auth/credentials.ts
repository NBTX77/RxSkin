import type { CWCredentials } from '@/lib/cw/client'

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key || key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters')
  }
  return Buffer.from(key.slice(0, 32), 'utf-8')
}

export function encryptCredential(plaintext: string): string {
  const crypto = require('crypto')
  const iv = crypto.randomBytes(12)
  const key = getEncryptionKey()
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decryptCredential(ciphertext: string): string {
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

export async function getTenantCredentials(tenantId: string): Promise<CWCredentials> {
  // Dev fallback to env vars — replace with DB lookup for multi-tenant
  return {
    baseUrl: process.env.CW_BASE_URL ?? '',
    companyId: process.env.CW_COMPANY_ID ?? '',
    clientId: process.env.CW_CLIENT_ID ?? '',
    publicKey: process.env.CW_PUBLIC_KEY ?? '',
    privateKey: process.env.CW_PRIVATE_KEY ?? '',
  }
}
