'use client'

import { useState, useRef, useEffect } from 'react'
import { useM365Tenant } from './M365TenantProvider'
import { ChevronDown, Search, Building2, Check } from 'lucide-react'

export function TenantSelector() {
  const { selectedTenantId, selectedTenant, tenants, isLoading, setSelectedTenant } = useM365Tenant()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = tenants.filter(t =>
    t.isActive && (
      t.displayName.toLowerCase().includes(search.toLowerCase()) ||
      (t.domain?.toLowerCase().includes(search.toLowerCase()))
    )
  )

  const gdapDot: Record<string, string> = {
    active: 'bg-emerald-500',
    pending: 'bg-yellow-500',
    expired: 'bg-red-500',
  }

  const displayLabel = selectedTenant ? selectedTenant.displayName : 'RX Technology (Internal)'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700/50 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full sm:w-auto"
      >
        <Building2 size={14} className="text-gray-500" />
        <span className="truncate max-w-[200px]">{isLoading ? 'Loading...' : displayLabel}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 z-50 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/50 rounded-lg shadow-lg overflow-hidden">
          {tenants.length > 3 && (
            <div className="p-2 border-b border-gray-100 dark:border-gray-700/50">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search tenants..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded text-gray-900 dark:text-white placeholder-gray-500"
                  autoFocus
                />
              </div>
            </div>
          )}
          <div className="max-h-60 overflow-y-auto">
            {/* RX Technology (own tenant) */}
            <button
              onClick={() => { setSelectedTenant(null); setIsOpen(false); setSearch('') }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 ${
                !selectedTenantId ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
              }`}
            >
              <Building2 size={14} className="text-gray-500 flex-shrink-0" />
              <span className="flex-1 truncate">RX Technology (Internal)</span>
              {!selectedTenantId && <Check size={14} className="text-blue-500 flex-shrink-0" />}
            </button>

            {filtered.map(tenant => (
              <button
                key={tenant.id}
                onClick={() => { setSelectedTenant(tenant.id); setIsOpen(false); setSearch('') }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  selectedTenantId === tenant.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                }`}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${gdapDot[tenant.gdapStatus] || 'bg-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{tenant.displayName}</div>
                  {tenant.domain && <div className="text-xs text-gray-500 truncate">{tenant.domain}</div>}
                </div>
                {selectedTenantId === tenant.id && <Check size={14} className="text-blue-500 flex-shrink-0" />}
              </button>
            ))}

            {filtered.length === 0 && tenants.length > 0 && (
              <p className="px-3 py-4 text-sm text-gray-500 text-center">No matching tenants</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
