'use client'

import { useState } from 'react'
import {
  Search,
  Plus,
  MoreVertical,
} from 'lucide-react'
import type { DepartmentCode, UserRole } from '@/types'

// ── Mock data (replaced by Prisma queries in production) ─────

interface AppUser {
  id: string
  name: string
  email: string
  role: UserRole
  department: DepartmentCode
  status: 'active' | 'disabled'
  lastLogin?: string
  cwMemberId?: string
}

const mockUsers: AppUser[] = [
  { id: '1', name: 'Travis Brown', email: 'travislbrown@gmail.com', role: 'ADMIN', department: 'IT', status: 'active', lastLogin: '2026-03-28T14:30:00Z', cwMemberId: 'TBrown' },
  { id: '2', name: 'John Smith', email: 'jsmith@rxtech.com', role: 'TECH', department: 'IT', status: 'active', lastLogin: '2026-03-28T09:15:00Z' },
  { id: '3', name: 'Sarah Johnson', email: 'sjohnson@rxtech.com', role: 'TECH', department: 'SI', status: 'active', lastLogin: '2026-03-27T16:45:00Z' },
  { id: '4', name: 'Mike Davis', email: 'mdavis@rxtech.com', role: 'TECH', department: 'AM', status: 'disabled', lastLogin: '2026-03-20T11:00:00Z' },
  { id: '5', name: 'Lisa Wong', email: 'lwong@rxtech.com', role: 'VIEWER', department: 'GA', status: 'active' },
]

const roleColors: Record<string, string> = {
  ADMIN: 'bg-orange-600/20 text-orange-400 border-orange-500/30',
  TECH: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
  VIEWER: 'bg-gray-600/20 text-gray-600 dark:text-gray-400 border-gray-500/30',
}

const deptColors: Record<string, string> = {
  IT: 'text-blue-400',
  SI: 'text-cyan-400',
  AM: 'text-green-400',
  GA: 'text-orange-400',
  LT: 'text-purple-400',
}

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  const filtered = mockUsers.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Users</h2>
          <p className="text-sm text-gray-500 mt-1">Manage user accounts, roles, and permissions.</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={14} />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-700 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All roles</option>
          <option value="ADMIN">Admin</option>
          <option value="TECH">Tech</option>
          <option value="VIEWER">Viewer</option>
        </select>
      </div>

      {/* User list */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-900 overflow-hidden">
        {/* Desktop header */}
        <div className="hidden sm:grid grid-cols-[1fr_120px_80px_100px_140px_40px] gap-4 px-5 py-3 border-b border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span>User</span>
          <span>Role</span>
          <span>Dept</span>
          <span>Status</span>
          <span>Last Login</span>
          <span />
        </div>

        {filtered.map(user => (
          <div key={user.id} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_80px_100px_140px_40px] gap-2 sm:gap-4 items-center px-5 py-3 border-b border-gray-200 dark:border-gray-800/50 hover:bg-gray-800/30 transition-colors">
            {/* User info */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>

            {/* Role badge */}
            <span className={`text-xs font-medium px-2 py-0.5 rounded border w-fit ${roleColors[user.role]}`}>
              {user.role}
            </span>

            {/* Department */}
            <span className={`text-xs font-medium ${deptColors[user.department] || 'text-gray-500'}`}>
              {user.department}
            </span>

            {/* Status */}
            <span className={`flex items-center gap-1.5 text-xs ${
              user.status === 'active' ? 'text-green-400' : 'text-gray-500'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-gray-600'}`} />
              {user.status === 'active' ? 'Active' : 'Disabled'}
            </span>

            {/* Last login */}
            <span className="text-xs text-gray-500">
              {user.lastLogin
                ? new Date(user.lastLogin).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                : 'Never'}
            </span>

            {/* Actions */}
            <button className="text-gray-500 hover:text-gray-700 dark:text-gray-300 transition-colors p-1 rounded">
              <MoreVertical size={14} />
            </button>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-gray-500">No users match your search.</div>
        )}
      </div>
    </div>
  )
}
