'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Ticket, Building2, User } from 'lucide-react'
import type { Ticket as TicketType, Member } from '@/types'

interface SearchResults {
  tickets: TicketType[]
  companies: Array<{ id: number; name: string }>
  members: Member[]
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>({ tickets: [], companies: [], members: [] })
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()

  // Ctrl+K / Cmd+K to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ tickets: [], companies: [], members: [] })
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          setResults(await res.json())
        }
      } catch { /* ignore */ }
      setLoading(false)
    }, 200)

    return () => clearTimeout(timer)
  }, [query])

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults({ tickets: [], companies: [], members: [] })
      setSelectedIndex(0)
    }
  }, [open])

  const allItems = useMemo(() => [
    ...results.tickets.map(t => ({ type: 'ticket' as const, id: t.id, label: t.summary, sub: `#${t.id} · ${t.company}`, href: `/tickets/${t.id}` })),
    ...results.companies.map(c => ({ type: 'company' as const, id: c.id, label: c.name, sub: 'Company', href: `/companies` })),
    ...results.members.map(m => ({ type: 'member' as const, id: m.id, label: m.name, sub: m.title ?? 'Technician', href: `/settings` })),
  ], [results])

  const handleSelect = useCallback((href: string) => {
    setOpen(false)
    router.push(href)
  }, [router])

  // Keyboard nav
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, allItems.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && allItems[selectedIndex]) {
        e.preventDefault()
        handleSelect(allItems[selectedIndex].href)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, allItems, selectedIndex, handleSelect])

  if (!open) return null

  const icons = {
    ticket: <Ticket size={14} className="text-blue-400" />,
    company: <Building2 size={14} className="text-green-400" />,
    member: <User size={14} className="text-purple-400" />,
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Dialog */}
      <div role="dialog" aria-modal="true" aria-label="Global search" className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-lg z-[101]">
        <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center px-4 gap-3 border-b border-gray-800">
            <Search size={18} className="text-gray-500 flex-shrink-0" />
            <label htmlFor="global-search" className="sr-only">Search tickets, companies, techs</label>
            <input
              id="global-search"
              autoFocus
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
              placeholder="Search tickets, companies, techs..."
              className="flex-1 py-3.5 bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-800 text-gray-500 border border-gray-700">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">Searching...</div>
            )}

            {!loading && query && allItems.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No results for &ldquo;{query}&rdquo;
              </div>
            )}

            {!loading && allItems.length > 0 && (
              <div className="py-2">
                {/* Group headers */}
                {results.tickets.length > 0 && (
                  <div className="px-4 pt-2 pb-1">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tickets</p>
                  </div>
                )}
                {results.tickets.map((t, i) => {
                  const idx = i
                  return (
                    <button
                      key={`t-${t.id}`}
                      onClick={() => handleSelect(`/tickets/${t.id}`)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        selectedIndex === idx ? 'bg-blue-600/20 text-white' : 'text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      {icons.ticket}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{t.summary}</p>
                        <p className="text-xs text-gray-500">#{t.id} · {t.company}</p>
                      </div>
                    </button>
                  )
                })}

                {results.companies.length > 0 && (
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Companies</p>
                  </div>
                )}
                {results.companies.map((c, i) => {
                  const idx = results.tickets.length + i
                  return (
                    <button
                      key={`c-${c.id}`}
                      onClick={() => handleSelect('/companies')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        selectedIndex === idx ? 'bg-blue-600/20 text-white' : 'text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      {icons.company}
                      <span className="text-sm">{c.name}</span>
                    </button>
                  )
                })}

                {results.members.length > 0 && (
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Technicians</p>
                  </div>
                )}
                {results.members.map((m, i) => {
                  const idx = results.tickets.length + results.companies.length + i
                  return (
                    <button
                      key={`m-${m.id}`}
                      onClick={() => handleSelect('/settings')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        selectedIndex === idx ? 'bg-blue-600/20 text-white' : 'text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      {icons.member}
                      <div>
                        <p className="text-sm">{m.name}</p>
                        <p className="text-xs text-gray-500">{m.title}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {!loading && !query && (
              <div className="px-4 py-6 text-center text-gray-600 text-sm">
                <p>Type to search across tickets, companies, and techs</p>
                <p className="text-xs mt-2 text-gray-700">Try a ticket number, company name, or keyword</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-800 text-[11px] text-gray-600">
            <span>Navigate with arrow keys</span>
            <span>Enter to select</span>
          </div>
        </div>
      </div>
    </>
  )
}
