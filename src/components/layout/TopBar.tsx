'use client'

import { Search } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { UserAvatar } from './UserAvatar'
import { useDepartment } from '@/components/department/DepartmentProvider'

function getBreadcrumb(pathname: string): { section: string; detail?: string } {
  if (pathname === '/dashboard') return { section: 'My Day' }
  if (pathname === '/tickets') return { section: 'Tickets' }
  if (pathname.startsWith('/tickets/')) return { section: 'Tickets', detail: `#${pathname.split('/').pop()}` }
  if (pathname === '/projects') return { section: 'Projects' }
  if (pathname.startsWith('/projects/')) return { section: 'Projects', detail: `#${pathname.split('/').pop()}` }
  if (pathname === '/schedule') return { section: 'Schedule' }
  if (pathname === '/companies') return { section: 'Companies' }
  if (pathname.startsWith('/companies/')) return { section: 'Companies', detail: pathname.split('/').pop() }
  if (pathname === '/ops/fleet-map') return { section: 'Fleet Map' }
  if (pathname === '/ops/analytics') return { section: 'Analytics' }
  if (pathname === '/ops/holds') return { section: 'Schedule Holds' }
  if (pathname.startsWith('/ops')) return { section: 'Operations' }
  if (pathname.startsWith('/settings')) return { section: 'Settings' }
  if (pathname.startsWith('/admin')) return { section: 'Admin' }
  return { section: 'Dashboard' }
}

function getGreeting(): string {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

export function TopBar() {
  const { config } = useDepartment()
  const pathname = usePathname()
  const breadcrumb = getBreadcrumb(pathname)
  const { data: session } = useSession()
  const isDashboard = pathname === '/dashboard'
  const firstName = session?.user?.name?.split(' ')[0] ?? 'there'

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
    <header className="sticky top-0 z-30 h-14 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)] flex items-center justify-between px-4 lg:px-6">
      {/* Left: Logo on mobile, empty on desktop (sidebar has logo) */}
      <div className="flex items-center gap-3 lg:hidden">
        <div className={`w-7 h-7 rounded-lg ${getColorBg(config.color)} flex items-center justify-center`}>
          <span className="text-gray-900 dark:text-white font-bold text-xs">RX</span>
        </div>
        <span className="text-gray-900 dark:text-white font-semibold text-sm">RX Skin</span>
      </div>

      {/* Left: Greeting on dashboard, breadcrumb on other pages (desktop only) */}
      {isDashboard ? (
        <div className="hidden lg:flex flex-col justify-center">
          <span className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
            {getGreeting()}, {firstName}
          </span>
          <span className="text-xs text-gray-500 leading-tight">
            {format(new Date(), 'EEEE, MMMM d')}
          </span>
        </div>
      ) : (
        <div className="hidden lg:flex items-center gap-1.5 text-sm">
          <span className="text-gray-900 dark:text-gray-300 font-medium">{breadcrumb.section}</span>
          {breadcrumb.detail && (
            <>
              <span className="text-gray-400">/</span>
              <span className="text-gray-500">{breadcrumb.detail}</span>
            </>
          )}
        </div>
      )}

      {/* Right: Search + Avatar */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }))
          }}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Search"
        >
          <Search size={18} />
        </button>
        <UserAvatar />
      </div>
    </header>
  )
}
