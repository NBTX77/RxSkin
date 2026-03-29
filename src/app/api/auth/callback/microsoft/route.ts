// ============================================================
// GET /api/auth/callback/microsoft — OAuth2 callback handler
// Receives authorization code from Microsoft, exchanges for
// access + refresh tokens, stores in UserOAuthToken table.
// ============================================================

import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

const MICROSOFT_SCOPES =
  'openid profile email offline_access Mail.Read Mail.Send Calendars.ReadWrite Chat.ReadWrite Presence.Read.All'

const TOKEN_ENDPOINT = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') // userId passed when initiating the flow
    const error = url.searchParams.get('error')
    const errorDescription = url.searchParams.get('error_description')

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    // ── Handle error from Microsoft ──────────────────────────
    if (error) {
      console.error('[Microsoft OAuth] Error from Microsoft:', error, errorDescription)
      const redirectUrl = new URL('/settings', baseUrl)
      redirectUrl.searchParams.set('connection', 'microsoft')
      redirectUrl.searchParams.set('status', 'error')
      redirectUrl.searchParams.set('message', errorDescription || error)
      return NextResponse.redirect(redirectUrl.toString())
    }

    // ── Validate required params ─────────────────────────────
    if (!code || !state) {
      const redirectUrl = new URL('/settings', baseUrl)
      redirectUrl.searchParams.set('connection', 'microsoft')
      redirectUrl.searchParams.set('status', 'error')
      redirectUrl.searchParams.set('message', 'Missing authorization code or state')
      return NextResponse.redirect(redirectUrl.toString())
    }

    const userId = state

    // ── Validate env vars ────────────────────────────────────
    const clientId = process.env.AZURE_AD_CLIENT_ID
    const clientSecret = process.env.AZURE_AD_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      console.error('[Microsoft OAuth] Missing AZURE_AD_CLIENT_ID or AZURE_AD_CLIENT_SECRET')
      const redirectUrl = new URL('/settings', baseUrl)
      redirectUrl.searchParams.set('connection', 'microsoft')
      redirectUrl.searchParams.set('status', 'error')
      redirectUrl.searchParams.set('message', 'Server configuration error')
      return NextResponse.redirect(redirectUrl.toString())
    }

    const redirectUri = `${baseUrl}/api/auth/callback/microsoft`

    // ── Exchange authorization code for tokens ───────────────
    const tokenBody = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      scope: MICROSOFT_SCOPES,
    })

    const tokenResponse = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody.toString(),
    })

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text()
      console.error('[Microsoft OAuth] Token exchange failed:', tokenResponse.status, errorBody)
      const redirectUrl = new URL('/settings', baseUrl)
      redirectUrl.searchParams.set('connection', 'microsoft')
      redirectUrl.searchParams.set('status', 'error')
      redirectUrl.searchParams.set('message', 'Failed to exchange authorization code')
      return NextResponse.redirect(redirectUrl.toString())
    }

    const tokenData = await tokenResponse.json()
    const { access_token, refresh_token, expires_in } = tokenData

    if (!access_token) {
      console.error('[Microsoft OAuth] No access_token in response')
      const redirectUrl = new URL('/settings', baseUrl)
      redirectUrl.searchParams.set('connection', 'microsoft')
      redirectUrl.searchParams.set('status', 'error')
      redirectUrl.searchParams.set('message', 'No access token received')
      return NextResponse.redirect(redirectUrl.toString())
    }

    // ── Calculate token expiration ───────────────────────────
    const expiresAt = new Date(Date.now() + (expires_in || 3600) * 1000)

    // ── Upsert tokens into UserOAuthToken table ──────────────
    // NOTE: Storing as plain text for now. Encryption TODO —
    // IV and authTag are placeholders until AES-256-GCM encryption is implemented.
    await prisma.userOAuthToken.upsert({
      where: {
        userId_provider: {
          userId,
          provider: 'microsoft',
        },
      },
      update: {
        accessToken: access_token,
        refreshToken: refresh_token || null,
        iv: '',        // Encryption TODO — placeholder
        authTag: '',   // Encryption TODO — placeholder
        scopes: MICROSOFT_SCOPES,
        expiresAt,
      },
      create: {
        userId,
        provider: 'microsoft',
        accessToken: access_token,
        refreshToken: refresh_token || null,
        iv: '',        // Encryption TODO — placeholder
        authTag: '',   // Encryption TODO — placeholder
        scopes: MICROSOFT_SCOPES,
        expiresAt,
      },
    })

    console.log(`[Microsoft OAuth] Tokens stored for user ${userId}`)

    // ── Redirect to settings with success ────────────────────
    const redirectUrl = new URL('/settings', baseUrl)
    redirectUrl.searchParams.set('connection', 'microsoft')
    redirectUrl.searchParams.set('status', 'success')
    return NextResponse.redirect(redirectUrl.toString())
  } catch (error) {
    console.error('[Microsoft OAuth] Unexpected error:', error)
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const redirectUrl = new URL('/settings', baseUrl)
    redirectUrl.searchParams.set('connection', 'microsoft')
    redirectUrl.searchParams.set('status', 'error')
    redirectUrl.searchParams.set('message', 'An unexpected error occurred')
    return NextResponse.redirect(redirectUrl.toString())
  }
}
