import { getGraphToken } from './auth';
import { logApiCall } from '@/lib/instrumentation/api-logger';
import { getDefaultTenantId } from '@/lib/instrumentation/tenant-context';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';
const SHAREPOINT_HOSTNAME = 'rxtechnology.sharepoint.com';
const SITE_PATH = '/sites/MissionControl';

let cachedSiteId: string | null = null;
let cachedDriveId: string | null = null;

async function graphFetch(path: string, options?: RequestInit): Promise<Record<string, unknown>> {
  const token = await getGraphToken();
  const url = `${GRAPH_BASE}${path}`;
  const start = Date.now();

  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const duration = Date.now() - start;

  // Log to instrumentation — fire-and-forget
  getDefaultTenantId()
    .then((tenantId) => {
      logApiCall(
        {
          tenantId,
          platform: 'graph',
          method: (options?.method || 'GET') as string,
          endpoint: path,
        },
        {
          statusCode: res.status,
          responseTimeMs: duration,
        }
      );
    })
    .catch(() => {});

  if (!res.ok) {
    const error = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const errorObj = error?.error as Record<string, unknown> | undefined;
    throw new Error(`Graph API ${res.status}: ${errorObj?.message || res.statusText}`);
  }

  return res.json() as Promise<Record<string, unknown>>;
}

export async function getSiteId(): Promise<string> {
  if (cachedSiteId) return cachedSiteId;
  const data = await graphFetch(`/sites/${SHAREPOINT_HOSTNAME}:${SITE_PATH}`);
  cachedSiteId = data.id as string;
  return data.id as string;
}

export async function getDriveId(): Promise<string> {
  if (cachedDriveId) return cachedDriveId;
  const siteId = await getSiteId();
  const data = await graphFetch(`/sites/${siteId}/drives`);
  const drives = data.value as Array<Record<string, unknown>>;
  const docDrive = drives.find((d) =>
    d.name === 'Documents' || d.name === 'Shared Documents'
  ) || drives[0];
  cachedDriveId = docDrive.id as string;
  return docDrive.id as string;
}

export async function listFolderContents(
  folderId?: string,
  options?: { top?: number; orderby?: string; skipToken?: string }
): Promise<{ items: Record<string, unknown>[]; nextLink?: string }> {
  const driveId = await getDriveId();
  const siteId = await getSiteId();

  const basePath = folderId
    ? `/sites/${siteId}/drives/${driveId}/items/${folderId}/children`
    : `/sites/${siteId}/drives/${driveId}/root/children`;

  const params = new URLSearchParams();
  params.set('$top', String(options?.top || 50));
  params.set('$orderby', options?.orderby || 'name asc');
  params.set('$select', 'id,name,size,file,folder,lastModifiedDateTime,lastModifiedBy,createdDateTime,webUrl,parentReference');

  if (options?.skipToken) {
    params.set('$skipToken', options.skipToken);
  }

  const data = await graphFetch(`${basePath}?${params.toString()}`);

  return {
    items: (data.value as Record<string, unknown>[]) || [],
    nextLink: (data['@odata.nextLink'] as string) || undefined,
  };
}

export async function getItemMetadata(itemId: string): Promise<Record<string, unknown>> {
  const driveId = await getDriveId();
  const siteId = await getSiteId();
  return graphFetch(`/sites/${siteId}/drives/${driveId}/items/${itemId}`);
}

export async function getItemPath(itemId: string): Promise<Record<string, unknown>> {
  const driveId = await getDriveId();
  const siteId = await getSiteId();
  return graphFetch(
    `/sites/${siteId}/drives/${driveId}/items/${itemId}?$select=id,name,parentReference`
  );
}

export async function searchDocuments(
  query: string,
  options?: { top?: number }
): Promise<Record<string, unknown>[]> {
  const driveId = await getDriveId();
  const siteId = await getSiteId();

  const params = new URLSearchParams();
  params.set('$top', String(options?.top || 25));
  params.set('$select', 'id,name,size,file,folder,lastModifiedDateTime,lastModifiedBy,webUrl,parentReference');

  const data = await graphFetch(
    `/sites/${siteId}/drives/${driveId}/root/search(q='${encodeURIComponent(query)}')?${params.toString()}`
  );

  return (data.value as Record<string, unknown>[]) || [];
}
