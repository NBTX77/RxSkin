// ============================================================
// TanStack Query Key Factory — RX Skin
// All query keys MUST include tenantId to prevent cross-tenant cache leaks.
// ============================================================

import type { TicketFilters, ScheduleFilters, ProjectFilters } from '@/types'

export const queryKeys = {
  tickets: {
    all: (tenantId: string) =>
      ['tickets', tenantId] as const,
    list: (tenantId: string, filters: TicketFilters) =>
      ['tickets', tenantId, 'list', filters] as const,
    detail: (tenantId: string, id: number) =>
      ['tickets', tenantId, 'detail', id] as const,
    notes: (tenantId: string, id: number) =>
      ['tickets', tenantId, 'notes', id] as const,
  },

  schedule: {
    all: (tenantId: string) =>
      ['schedule', tenantId] as const,
    entries: (tenantId: string, filters: ScheduleFilters) =>
      ['schedule', tenantId, 'entries', filters] as const,
  },

  companies: {
    all: (tenantId: string) =>
      ['companies', tenantId] as const,
    list: (tenantId: string, search?: string) =>
      ['companies', tenantId, 'list', search] as const,
    detail: (tenantId: string, id: number) =>
      ['companies', tenantId, 'detail', id] as const,
  },

  projects: {
    all: (tenantId: string) =>
      ['projects', tenantId] as const,
    list: (tenantId: string, filters: ProjectFilters) =>
      ['projects', tenantId, 'list', filters] as const,
    detail: (tenantId: string, id: number) =>
      ['projects', tenantId, 'detail', id] as const,
  },

  members: {
    all: (tenantId: string) =>
      ['members', tenantId] as const,
  },
} as const
