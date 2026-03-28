# RX Skin - Authentication Architecture

## Two-Tier Auth Model

### Tier 1: Service Account Credentials (Per-Tenant)
Org-level API keys stored per tenant. BFF injects on every call.
- ConnectWise Manage: Basic Auth (Base64 publicKey:privateKey)
- ConnectWise Automate: API Key + session token
- ConnectWise Control: Basic Auth (Base64 username:password)
- Samsara: Bearer token
- SentinelOne, Passportal, ScalePad, Datto, Auvik: API Key variants

Phase 1: .env.local. Phase 2+: AES-256-GCM encrypted in TenantCredential table.

### Tier 2: User-Delegated OAuth2 (Per-User)
Microsoft Graph and Webex require per-user OAuth2 consent.
- Graph scopes: Mail.Read Mail.Send Calendars.ReadWrite Presence.Read.All Chat.Read
- Webex scopes: spark:calling spark:messages_read spark:messages_write spark:people_read

## Session Management
NextAuth.js v5, JWT strategy. Phase 1: CredentialsProvider. Phase 2+: Azure AD.

## Key Decisions
- Azure AD as primary IdP
- No middleware.ts (Node v24 edge runtime conflict)
- CW Home SSO with Azure AD recommended

Last updated: 2026-03-28
