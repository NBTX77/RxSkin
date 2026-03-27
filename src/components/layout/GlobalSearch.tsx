'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Command, X } from 'lucide-react'

interface SearchResult {
  id: number
  type: 'ticket' | 'company' | 'contact'
  title: string
  subtitle?: string
}

async function searchGlobal(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return []

  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
  if (!response.ok) return []

  const data = await response.json()
  return data.results || []
}

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)

  // Open on Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    if (open) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  // Search on query change
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim()) {
        setIsSearching(true)
        const res = await searchGlobal(query)
        setResults(res)
        setSelectedIndex(0)
        setIsSearching(false)
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Navigation
  const handleSelect = (result: SearchResult) => {
    if (result.type === 'ticket') {
      router.push(`/tickets/${result.id}`)
    } else if (result.type === 'company') {
      router.push(`/companies/${result.id}`)
    }
    setOpen(false)
    setQuery('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % (results.length || 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + results.length) % (results.length || 1))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      handleSelect(results[selectedIndex])
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-12 z-50 p-4">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
          <Search size={18} className="text-gray-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search tickets, companies..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="flex-1 bg-transparent text-white placeholder-gray-600 text-sm focus:outline-none"
          />
          <button
            onClick={() => {
              setOpen(false)
              setQuery('')
            }}
            className="text-gray-500 hover:text-gray-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-gray-800">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className={`w-full px-4 py-3 text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-600/15 border-l-2 border-blue-500'
                      : 'hover:bg-gray-800'
                  }`}
                >
                  <p className="text-sm font-medium text-white">{result.title}</p>
                  {result.subtitle && (
                    <p className="text-xs text-gray-500 mt-1">{result.subtitle}</p>
                  )}
                </button>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              No results found
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-600 text-sm">
              <p>Start typing to search...</p>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-800 bg-gray-900/50 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700">
              <Command size={12} />
            </kbd>
            <span>K</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700">↓</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700">⏎</kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700">Esc</kbd>
              <span>Close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
