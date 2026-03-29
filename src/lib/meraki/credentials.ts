// ============================================================
// Meraki Credential Helpers — RX Skin BFF Layer
// Checks env vars + admin-configured credentials.
// NEVER import in client components — server-side only.
// ============================================================

export interface MerakiCredentials {
  apiKey: string
  baseUrl: string
}

const MERAKI_BASE_URL = 'https://api.meraki.com/api/v1'

/**
 * Check if Meraki API credentials are configured via env vars.
 * Returns false if MERAKI_API_KEY is missing or empty.
 */
export function isMerakiConfigured(): boolean {
  return !!process.env.MERAKI_API_KEY
}

/**
 * Get Meraki API credentials. Returns null if not configured.
 */
export function getMerakiCredentials(): MerakiCredentials | null {
  const apiKey = process.env.MERAKI_API_KEY
  if (!apiKey) return null

  return {
    apiKey,
    baseUrl: process.env.MERAKI_BASE_URL || MERAKI_BASE_URL,
  }
}

/**
 * Check if Meraki demo mode is enabled.
 * Demo mode is activated by:
 *  1. Cookie 'meraki_demo_mode' = 'true' (set from admin toggle)
 *  2. No credentials configured (auto-fallback)
 *
 * Server-side: reads from cookies passed in request headers.
 * Use isMerakiDemoModeFromCookie(cookieHeader) for API routes.
 */
export function isMerakiDemoMode(cookieHeader?: string | null): boolean {
  // If no credentials configured, always demo mode
  if (!isMerakiConfigured()) return true

  // Check cookie for explicit demo toggle
  if (cookieHeader) {
    const match = cookieHeader.match(/meraki_demo_mode=([^;]+)/)
    if (match && match[1] === 'true') return true
  }

  return false
}

/**
 * Get webhook secret for HMAC-SHA256 verification.
 */
export function getMerakiWebhookSecret(): string | null {
  return process.env.MERAKI_WEBHOOK_SECRET || null
}
