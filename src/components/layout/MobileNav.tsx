'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sun, Ticket, Calendar, Building2, Search, Map } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'My Day', icon: Sun },
  { href: '/tickets', label: 'Tickets', icon: Ticket },
  { href: '/schedule', label: 'Schedule', icon: Calendar },
  { href: '/ops/fleet-map', label: 'Fleet', icon: Map },
  { href: '/companies', label: 'Companies', icon: Building2 },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = label === 'Fleet'
            ? pathname.startsWith('/ops')
            : pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors min-w-0 ${
                active ? 'text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs font-medium truncate">{label}</span>
            </Link>
          )
        })}
        <button
          onClick={() => {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }))
          }}
          className="flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-300 transition-colors"
        >
          <Search size={20} />
          <span className="text-xs font-medium">Search</span>
        </button>
        {/* Theme toggle moved to Settings > Appearance */}
      </div>
    </nav>
  )
}
