// TanStack Query key factories
// All cache keys namespaced by tenantId to support multi-tenant isolation

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Filters = Record<string, any> | undefined

export const queryKeys = {
  tickets: {
    all: (tenantId: string) => [tenantId, 'tickets'] as const,
    list: (tenantId: string, filters?: Filters) =>
      [tenantId, 'tickets', 'list', filters] as const,
    detail: (tenantId: string, id: number) =>
      [tenantId, 'tickets', 'detail', id] as const,
  },
  schedule: {
    all: (tenantId: string) => [tenantId, 'schedule'] as const,
    entries: (tenantId: string, filters?: Filters) =>
      [tenantId, 'schedule', 'entries', filters] as const,
  },
  companies: {
    all: (tenantId: string) => [tenantId, 'companies'] as const,
    list: (tenantId: string) => [tenantId, 'companies', 'list'] as const,
    detail: (tenantId: string, id: number) =>
      [tenantId, 'companies', 'detail', id] as const,
  },
  members: {
    all: (tenantId: string) => [tenantId, 'members'] as const,
    list: (tenantId: string) => [tenantId, 'members', 'list'] as const,
  },
} as const
