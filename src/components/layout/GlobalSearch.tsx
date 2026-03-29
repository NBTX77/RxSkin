'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Ticket, Building2, User, FolderKanban, Loader2 } from 'lucide-react'

interface SearchResult {
  id: number
  type: 'ticket' | 'company' | 'member' | 'project'
  title: string
  subtitle: string
  href: string
}

interface GroupedResults {
  tickets: SearchResult[]
  companies: SearchResult[]
  members: SearchResult[]
  projects: SearchResult[]
}

const EMPTY_RESULTS: GroupedResults = { tickets: [], companies: [], members: [], projects: [] }

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  ticket: <Ticket size={14} className="text-blue-400" />,
  company: <Building2 size={14} className="text-green-400" />,
  member: <User size={14} className="text-purple-400" />,
  project: <FolderKanban size={14} className="text-amber-400" />,
}

const CATEGORY_LABELS: Record<string, string> = {
  tickets: 'Tickets',
  companies: 'Companies',
  members: 'Technicians',
  projects: 'Projects',
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GroupedResults>(EMPTY_RESULTS)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const pathname = usePathname()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Build a flat list of all results for keyboard navigation
  const allItems = useMemo(() => {
    const items: SearchResult[] = []
    if (results.tickets.length) items.push(...results.tickets)
    if (results.companies.length) items.push(...results.companies)
    if (results.members.length) items.push(...results.members)
    if (results.projects.length) items.push(...results.projects)
    return items
  }, [results])

  const openSearch = useCallback(() => {
    setOpen(true)
    // Focus after state update + render
    setTimeout(() => inputRef.current?.focus(), 30)
  }, [])

  const closeSearch = useCallback(() => {
    setOpen(false)
    setQuery('')
    setResults(EMPTY_RESULTS)
    setSelectedIndex(0)
  }, [])

  // Ctrl+K to toggle
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (open) {
          closeSearch()
        } else {
          openSearch()
        }
      }
      if (e.key === 'Escape' && open) {
        closeSearch()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, openSearch, closeSearch])

  // Close on route change
  useEffect(() => {
    closeSearch()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Debounced search (300ms)
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults(EMPTY_RESULTS)
      setLoading(false)
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data)
        }
      } catch {
        /* ignore */
      }
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Navigate to selected result
  const handleSelect = useCallback(
    (href: string) => {
      closeSearch()
      router.push(href)
    },
    [router, closeSearch]
  )

  // Keyboard navigation (arrows + enter)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, allItems.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && allItems[selectedIndex]) {
        e.preventDefault()
        handleSelect(allItems[selectedIndex].href)
      }
    },
    [allItems, selectedIndex, handleSelect]
  )

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return
    const active = listRef.current.querySelector('[data-active="true"]')
    if (active) {
      active.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  // Click outside to close
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeSearch()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, closeSearch])

  // Compute category start indices
  const ticketStart = 0
  const companyStart = results.tickets.length
  const memberStart = companyStart + results.companies.length
  const projectStart = memberStart + results.members.length

  const hasResults = allItems.length > 0
  const hasQuery = query.trim().length >= 2
  const showDropdown = open && (hasQuery || query.length > 0)

  // Render a category of results
  function renderCategory(key: keyof GroupedResults, startIdx: number) {
    const items = results[key]
    if (!items.length) return null

    return (
      <div key={key}>
        <div className="px-3 pt-2.5 pb-1 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {CATEGORY_LABELS[key]}
          </p>
        </div>
        {items.map((item, i) => {
          const idx = startIdx + i
          const isActive = selectedIndex === idx
          return (
            <button
              key={`${item.type}-${item.id}`}
              data-active={isActive}
              onClick={() => handleSelect(item.href)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-600/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <span className="flex-shrink-0">{CATEGORY_ICONS[item.type]}</span>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm truncate ${
                    isActive
                      ? 'text-blue-700 dark:text-blue-200 font-medium'
                      : 'text-gray-900 dark:text-gray-200'
                  }`}
                >
                  {item.title}
                </p>
                <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative" data-feedback-component="GlobalSearch">
      {/* Search pill */}
      <div
        className={`
          flex items-center h-9 rounded-full border transition-all duration-200 ease-in-out overflow-hidden
          ${open
            ? 'w-72 sm:w-80 border-blue-400 dark:border-blue-500 shadow-sm shadow-blue-500/10 bg-white dark:bg-gray-800'
            : 'w-9 border-transparent'
          }
        `}
      >
        <button
          onClick={() => {
            if (!open) openSearch()
          }}
          className={`flex items-center justify-center flex-shrink-0 w-9 h-9 transition-colors ${
            open ? '' : 'hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full'
          }`}
          aria-label="Search (Ctrl+K)"
        >
          {loading ? (
            <Loader2 size={16} className="text-blue-500 animate-spin" />
          ) : (
            <Search
              size={16}
              className={open ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}
            />
          )}
        </button>

        {open && (
          <>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelectedIndex(0)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search..."
              className="flex-1 h-full bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none pr-1"
            />
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 mr-2 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-600 flex-shrink-0">
              Esc
            </kbd>
          </>
        )}
      </div>

      {/* Results dropdown */}
      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-[22rem] sm:w-[26rem] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl shadow-xl overflow-hidden z-[60]">
          <div ref={listRef} className="max-h-80 overflow-y-auto">
            {loading && !hasResults && (
              <div className="px-4 py-6 text-center text-gray-500 text-sm">Searching...</div>
            )}

            {!loading && hasQuery && !hasResults && (
              <div className="px-4 py-6 text-center text-sm">
                <p className="text-gray-500">No results for &ldquo;{query}&rdquo;</p>
              </div>
            )}

            {hasResults && (
              <div className="py-1">
                {renderCategory('tickets', ticketStart)}
                {renderCategory('companies', companyStart)}
                {renderCategory('members', memberStart)}
                {renderCategory('projects', projectStart)}
              </div>
            )}

            {!hasQuery && (
              <div className="px-4 py-5 text-center text-sm">
                <p className="text-gray-500 dark:text-gray-400">
                  Type to search (min 2 chars)
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {hasResults && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400 dark:text-gray-500">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-0.5">
                  <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    &uarr;&darr;
                  </kbd>
                  navigate
                </span>
                <span className="flex items-center gap-0.5">
                  <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    &crarr;
                  </kbd>
                  select
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
