'use client'

import { TrendingUp } from 'lucide-react'

export default function OpportunitiesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <TrendingUp size={32} className="text-gray-400" />
      </div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Opportunities</h1>
      <p className="text-gray-500 dark:text-gray-400 max-w-md">Opportunity pipeline with forecasting and win/loss tracking.</p>
      <span className="mt-4 text-xs text-gray-400 dark:text-gray-600">Phase 2A — Coming Soon</span>
    </div>
  )
}
