'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useM365Tenant } from './M365TenantProvider'
import { getSkuFriendlyName } from '@/lib/graph/sku-names'
import { Loader2, RefreshCw, ChevronDown, ChevronUp, Users } from 'lucide-react'

interface SubscribedSku {
  id: string
  skuId: string
  skuPartNumber: string
  capabilityStatus: string
  consumedUnits: number
  prepaidUnits: {
    enabled: number
    suspended: number
    warning: number
  }
}

interface LicensedUser {
  id: string
  displayName: string
  userPrincipalName: string
  assignedLicenses: Array<{ skuId: string; disabledPlans: string[] }>
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const color =
    pct > 95 ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-emerald-500'
  return (
    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function SkuCard({ sku, users }: { sku: SubscribedSku; users: LicensedUser[] }) {
  const [expanded, setExpanded] = useState(false)
  const total = sku.prepaidUnits.enabled
  const used = sku.consumedUnits
  const available = Math.max(total - used, 0)
  const pct = total > 0 ? Math.round((used / total) * 100) : 0

  const assignedUsers = users.filter(u =>
    u.assignedLicenses.some(l => l.skuId === sku.skuId)
  )

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {getSkuFriendlyName(sku.skuPartNumber)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{sku.skuPartNumber}</p>
        </div>
        {sku.capabilityStatus !== 'Enabled' && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 flex-shrink-0">
            {sku.capabilityStatus}
          </span>
        )}
      </div>

      <ProgressBar value={used} max={total} />

      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400">
          {used} of {total} licenses used
        </span>
        <span className={`font-medium ${pct > 95 ? 'text-red-500' : pct > 80 ? 'text-yellow-500' : 'text-emerald-500'}`}>
          {pct}%
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{available} available</span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          <Users size={12} />
          Manage Users
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-1 max-h-48 overflow-y-auto">
          {assignedUsers.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-2">No users assigned</p>
          ) : (
            assignedUsers.map(user => (
              <div key={user.id} className="flex items-center gap-2 py-1">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{user.displayName}</p>
                  <p className="text-[10px] text-gray-500 truncate">{user.userPrincipalName}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export function M365LicenseDashboard() {
  const { selectedTenantId } = useM365Tenant()
  const tenantParam = selectedTenantId ? `?clientTenantId=${selectedTenantId}` : ''

  const { data: skusData, isLoading: skusLoading, isError: skusError, refetch: refetchSkus } = useQuery<{ skus: SubscribedSku[] }>({
    queryKey: ['m365-licenses-skus', selectedTenantId],
    queryFn: async () => {
      const res = await fetch(`/api/m365/licenses${tenantParam}`)
      if (!res.ok) throw new Error('Failed to fetch licenses')
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: usersData, isLoading: usersLoading } = useQuery<{ users: LicensedUser[] }>({
    queryKey: ['m365-licenses-users', selectedTenantId],
    queryFn: async () => {
      const res = await fetch(`/api/m365/licenses/users${tenantParam}`)
      if (!res.ok) throw new Error('Failed to fetch licensed users')
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  const skus = skusData?.skus ?? []
  const users = usersData?.users ?? []
  const isLoading = skusLoading || usersLoading

  // KPI calculations
  const totalConsumed = skus.reduce((sum, s) => sum + s.consumedUnits, 0)
  const totalPrepaid = skus.reduce((sum, s) => sum + s.prepaidUnits.enabled, 0)
  const totalAvailable = Math.max(totalPrepaid - totalConsumed, 0)
  const utilPct = totalPrepaid > 0 ? Math.round((totalConsumed / totalPrepaid) * 100) : 0

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* KPI skeleton */}
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4 animate-pulse">
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4 animate-pulse space-y-3">
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
        <div className="flex justify-center py-4">
          <Loader2 size={20} className="animate-spin text-blue-500" />
        </div>
      </div>
    )
  }

  if (skusError) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl p-8 text-center">
        <p className="text-sm text-red-500 mb-3">Failed to load license data</p>
        <button
          onClick={() => refetchSkus()}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors mx-auto"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* KPI Strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Licenses</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalConsumed.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-0.5">of {totalPrepaid.toLocaleString()} purchased</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Available</p>
          <p className={`text-2xl font-bold ${totalAvailable < 10 ? 'text-red-500' : 'text-emerald-500'}`}>
            {totalAvailable.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">unassigned seats</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Utilization</p>
          <p className={`text-2xl font-bold ${utilPct > 95 ? 'text-red-500' : utilPct > 80 ? 'text-yellow-500' : 'text-gray-900 dark:text-white'}`}>
            {utilPct}%
          </p>
          <p className="text-xs text-gray-500 mt-0.5">across {skus.length} SKUs</p>
        </div>
      </div>

      {/* SKU Grid */}
      {skus.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-500">No license subscriptions found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skus.map(sku => (
            <SkuCard key={sku.id} sku={sku} users={users} />
          ))}
        </div>
      )}
    </div>
  )
}
