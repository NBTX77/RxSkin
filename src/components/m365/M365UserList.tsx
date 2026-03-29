'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useM365Tenant } from './M365TenantProvider'
import { M365UserDetail } from './M365UserDetail'
import type { M365User } from '@/types/m365'
import { Search, UserPlus, Filter, ChevronDown, Loader2 } from 'lucide-react'

type StatusFilter = 'all' | 'enabled' | 'disabled'

export function M365UserList() {
  const { selectedTenantId } = useM365Tenant()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<M365User | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [page, setPage] = useState(0)
  const filterRef = useRef<HTMLDivElement>(null)

  // Debounce search input
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(0)
    }, 300)
  }, [])

  // Close filter dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const tenantParam = selectedTenantId ? `&clientTenantId=${selectedTenantId}` : ''

  const { data, isLoading, isError } = useQuery<{ users: M365User[]; nextLink: string | null }>({
    queryKey: ['m365-users', selectedTenantId, page],
    queryFn: async () => {
      const res = await fetch(`/api/m365/users?skip=${page * 50}&top=50${tenantParam}`)
      if (!res.ok) throw new Error('Failed to fetch users')
      return res.json()
    },
    staleTime: 60_000,
  })

  const users = data?.users ?? []
  const hasMore = !!data?.nextLink

  // Client-side filter on search + status
  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchesSearch =
        !debouncedSearch ||
        u.displayName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        u.userPrincipalName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (u.jobTitle?.toLowerCase().includes(debouncedSearch.toLowerCase()))

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'enabled' && u.accountEnabled) ||
        (statusFilter === 'disabled' && !u.accountEnabled)

      return matchesSearch && matchesStatus
    })
  }, [users, debouncedSearch, statusFilter])

  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return (parts[0]?.[0] ?? '?').toUpperCase()
  }

  const statusLabels: Record<StatusFilter, string> = {
    all: 'All Status',
    enabled: 'Enabled',
    disabled: 'Disabled',
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {/* Status filter */}
          <div ref={filterRef} className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700/50 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Filter size={14} />
              <span className="hidden sm:inline">{statusLabels[statusFilter]}</span>
              <ChevronDown size={12} />
            </button>
            {filterOpen && (
              <div className="absolute top-full mt-1 left-0 z-40 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/50 rounded-lg shadow-lg overflow-hidden">
                {(Object.keys(statusLabels) as StatusFilter[]).map(key => (
                  <button
                    key={key}
                    onClick={() => { setStatusFilter(key); setFilterOpen(false) }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      statusFilter === key
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {statusLabels[key]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create user */}
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <UserPlus size={14} />
          <span>Create User</span>
        </button>
      </div>

      {/* Inline create form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">New User</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Display Name"
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500"
            />
            <input
              type="email"
              placeholder="User Principal Name"
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500"
            />
            <input
              type="text"
              placeholder="Job Title"
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500"
            />
            <input
              type="text"
              placeholder="Department"
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700">
              Create
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-blue-500" />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="text-center py-12">
          <p className="text-sm text-red-500">Failed to load users. Check API connection and try again.</p>
        </div>
      )}

      {/* Desktop table */}
      {!isLoading && !isError && (
        <>
          <div className="hidden md:block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Job Title</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Licenses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map(user => (
                  <tr
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {getInitials(user.displayName)}
                        </div>
                        <span className="text-gray-900 dark:text-white font-medium truncate">{user.displayName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 truncate max-w-[200px]">{user.userPrincipalName}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden lg:table-cell truncate max-w-[160px]">
                      {user.jobTitle || <span className="text-gray-400 dark:text-gray-600">--</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.accountEnabled
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {user.accountEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                      {user.assignedLicenses.length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No users found</p>
              </div>
            )}
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-2">
            {filtered.map(user => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="w-full text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {getInitials(user.displayName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.displayName}</p>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
                        user.accountEnabled
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {user.accountEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{user.userPrincipalName}</p>
                    {user.jobTitle && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{user.jobTitle}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{user.assignedLicenses.length} license{user.assignedLicenses.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </button>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No users found</p>
              </div>
            )}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}

      {/* User detail slide-over */}
      {selectedUser && (
        <M365UserDetail user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </>
  )
}
