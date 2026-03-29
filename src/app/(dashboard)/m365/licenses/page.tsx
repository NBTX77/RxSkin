'use client'
export const dynamic = 'force-dynamic'

import { M365TenantProvider } from '@/components/m365/M365TenantProvider'
import { TenantSelector } from '@/components/m365/TenantSelector'
import { M365LicenseDashboard } from '@/components/m365/M365LicenseDashboard'
import { CreditCard } from 'lucide-react'

export default function M365LicensesPage() {
  return (
    <M365TenantProvider>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard size={20} className="text-blue-500" />
              License Management
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Track subscription usage and assign licenses to users</p>
          </div>
          <TenantSelector />
        </div>

        <M365LicenseDashboard />
      </div>
    </M365TenantProvider>
  )
}
