'use client'

import { Package } from 'lucide-react'

export default function PurchaseOrdersPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Package size={32} className="text-gray-400" />
      </div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Purchase Orders</h1>
      <p className="text-gray-500 dark:text-gray-400 max-w-md">Purchase order management with vendor tracking and approval workflows.</p>
      <span className="mt-4 text-xs text-gray-400 dark:text-gray-600">Phase 2B — Coming Soon</span>
    </div>
  )
}
