import { ConfidentialClientApplication } from '@azure/msal-node';
import prisma from '@/lib/db/prisma';

const GRAPH_SCOPES = ['https://graph.microsoft.com/.default'];

// --- RX Technology tenant MSAL client (SharePoint, existing usage) ---

let msalClient: ConfidentialClientApplication | null = null;

function getMsalClient(): ConfidentialClientApplication {
  if (msalClient) return msalClient;

  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;
  const tenantId = process.env.AZURE_AD_TENANT_ID;

  if (!clientId || !clientSecret || !tenantId) {
    throw new Error('Azure AD credentials not configured. Set AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, AZURE_AD_TENANT_ID.');
  }

  msalClient = new ConfidentialClientApplication({
    auth: {
      clientId,
      clientSecret,
      authority: `https://login.microsoftonline.com/${tenantId}`,
    },
  });

  return msalClient;
}

/**
 * Get a Graph token for the RX Technology tenant (backward-compatible).
 * Used by SharePoint Document Hub and other single-tenant Graph calls.
 */
export async function getGraphToken(): Promise<string> {
  const client = getMsalClient();
  const result = await client.acquireTokenByClientCredential({
    scopes: GRAPH_SCOPES,
  });

  if (!result?.accessToken) {
    throw new Error('Failed to acquire Microsoft Graph token');
  }

  return result.accessToken;
}

// --- Multi-tenant MSAL client cache (GDAP) ---

const tenantMsalClients = new Map<string, ConfidentialClientApplication>();

/**
 * Get a Graph token for a specific client tenant via GDAP.
 * Uses the same multi-tenant Azure AD app credentials but targets the client's tenant authority.
 * MSAL handles token caching and refresh internally per instance.
 */
export async function getGraphTokenForTenant(clientTenantId: string): Promise<string> {
  let client = tenantMsalClients.get(clientTenantId);

  if (!client) {
    const creds = getMicrosoftCredentials(clientTenantId);

    client = new ConfidentialClientApplication({
      auth: {
        clientId: creds.clientId,
        clientSecret: creds.clientSecret,
        authority: `https://login.microsoftonline.com/${clientTenantId}`,
      },
    });

    tenantMsalClients.set(clientTenantId, client);
  }

  const result = await client.acquireTokenByClientCredential({
    scopes: GRAPH_SCOPES,
  });

  if (!result?.accessToken) {
    throw new Error(`Failed to acquire Microsoft Graph token for tenant ${clientTenantId}`);
  }

  return result.accessToken;
}

// --- User-delegated OAuth2 token retrieval ---

/**
 * Error thrown when a user's Microsoft OAuth token is missing or expired.
 * The frontend should redirect the user to re-authenticate via Settings > Connections.
 */
export class OAuthTokenExpiredError extends Error {
  constructor(userId: string) {
    super(`Microsoft OAuth token expired for user ${userId}. Re-authentication required.`);
    this.name = 'OAuthTokenExpiredError';
  }
}

/**
 * Get a user's delegated Microsoft Graph access token.
 * Used for per-user data: mail, calendar, Teams chat, presence.
 *
 * Phase 17C placeholder — currently returns the stored access token without refresh logic.
 * TODO (Task 90): Add automatic token refresh using the stored refreshToken when accessToken is expired.
 */
export async function getUserGraphToken(userId: string): Promise<string> {
  const tokenRecord = await prisma.userOAuthToken.findFirst({
    where: {
      userId,
      provider: 'microsoft',
    },
    select: {
      accessToken: true,
      expiresAt: true,
    },
  });

  if (!tokenRecord) {
    throw new OAuthTokenExpiredError(userId);
  }

  // TODO (Task 90): Check expiresAt and refresh using refreshToken if expired.
  // For now, return the stored access token as-is.
  // Note: accessToken is stored encrypted (AES-256-GCM) — decryption will be
  // handled by the credential vault utility once it's wired up.
  return tokenRecord.accessToken;
}

// --- Microsoft credential resolution ---

/**
 * Resolve Microsoft Azure AD credentials for API calls.
 * Falls back to environment variables (Phase 1 single-tenant).
 *
 * TODO: In future, read from TenantCredential table for per-tenant credential vault support.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getMicrosoftCredentials(_tenantId: string): {
  clientId: string;
  clientSecret: string;
  rxTenantId: string;
} {
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;
  const rxTenantId = process.env.AZURE_AD_TENANT_ID;

  if (!clientId || !clientSecret || !rxTenantId) {
    throw new Error('Azure AD credentials not configured. Set AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, AZURE_AD_TENANT_ID.');
  }

  return { clientId, clientSecret, rxTenantId };
}
