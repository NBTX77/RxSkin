'use client'

import { Search } from 'lucide-react'
import { UserAvatar } from './UserAvatar'
import { useDepartment } from '@/components/department/DepartmentProvider'

export function TopBar() {
  const { config } = useDepartment()

  const getColorBg = (color: string): string => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-600',
      cyan: 'bg-cyan-600',
      green: 'bg-green-600',
      orange: 'bg-orange-600',
      purple: 'bg-purple-600',
    }
    return colorMap[color] || 'bg-blue-600'
  }

  return (
    <header className="sticky top-0 z-30 h-14 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/60 flex items-center justify-between px-4 lg:px-6">
      {/* Left: Logo on mobile, empty on desktop (sidebar has logo) */}
      <div className="flex items-center gap-3 lg:hidden">
        <div className={`w-7 h-7 rounded-lg ${getColorBg(config.color)} flex items-center justify-center`}>
          <span className="text-white font-bold text-xs">RX</span>
        </div>
        <span className="text-white font-semibold text-sm">RX Skin</span>
      </div>

      {/* Left: Breadcrumb area on desktop */}
      <div className="hidden lg:block" />

      {/* Right: Search + Avatar */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }))
          }}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          aria-label="Search"
        >
          <Search size={18} />
        </button>
        <UserAvatar />
      </div>
    </header>
  )
}