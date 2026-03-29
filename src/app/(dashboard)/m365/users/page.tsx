'use client'
export const dynamic = 'force-dynamic'

import { M365TenantProvider } from '@/components/m365/M365TenantProvider'
import { TenantSelector } from '@/components/m365/TenantSelector'
import { M365UserList } from '@/components/m365/M365UserList'
import { M365GroupList } from '@/components/m365/M365GroupList'
import { useState } from 'react'
import { Users, Shield } from 'lucide-react'

export default function M365UsersPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'groups'>('users')

  return (
    <M365TenantProvider>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Microsoft 365</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage users, groups, and permissions</p>
          </div>
          <TenantSelector />
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Users size={14} /> Users
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'groups'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Shield size={14} /> Groups
          </button>
        </div>

        {/* Content */}
        {activeTab === 'users' ? <M365UserList /> : <M365GroupList />}
      </div>
    </M365TenantProvider>
  )
}
