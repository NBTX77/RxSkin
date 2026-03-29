'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ClientTenant } from '@/types/m365'

interface M365TenantContextValue {
  selectedTenantId: string | null  // null = RX Technology's own tenant
  selectedTenant: ClientTenant | null
  tenants: ClientTenant[]
  isLoading: boolean
  setSelectedTenant: (tenantId: string | null) => void
}

const M365TenantContext = createContext<M365TenantContextValue>({
  selectedTenantId: null,
  selectedTenant: null,
  tenants: [],
  isLoading: false,
  setSelectedTenant: () => {},
})

export function useM365Tenant() {
  return useContext(M365TenantContext)
}

export function M365TenantProvider({ children }: { children: ReactNode }) {
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('m365-selected-tenant') || null
    }
    return null
  })

  const { data: tenants = [], isLoading } = useQuery<ClientTenant[]>({
    queryKey: ['m365-tenants'],
    queryFn: async () => {
      const res = await fetch('/api/m365/tenants')
      if (!res.ok) return []
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  const selectedTenant = tenants.find(t => t.id === selectedTenantId) ?? null

  const setSelectedTenant = (tenantId: string | null) => {
    setSelectedTenantId(tenantId)
    if (typeof window !== 'undefined') {
      if (tenantId) {
        sessionStorage.setItem('m365-selected-tenant', tenantId)
      } else {
        sessionStorage.removeItem('m365-selected-tenant')
      }
    }
  }

  // Clear selection if tenant no longer exists
  useEffect(() => {
    if (selectedTenantId && tenants.length > 0 && !tenants.find(t => t.id === selectedTenantId)) {
      setSelectedTenant(null)
    }
  }, [selectedTenantId, tenants])

  return (
    <M365TenantContext.Provider value={{ selectedTenantId, selectedTenant, tenants, isLoading, setSelectedTenant }}>
      {children}
    </M365TenantContext.Provider>
  )
}
