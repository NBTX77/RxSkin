'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Wrench, ExternalLink, ChevronDown } from 'lucide-react'
import type { ExternalTool } from '@/lib/cw/tools'

interface ToolsSectionProps {
  collapsed: boolean
}

export function ToolsSection({ collapsed }: ToolsSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  const { data: tools = [] } = useQuery<ExternalTool[]>({
    queryKey: ['tools'],
    queryFn: async () => {
      const res = await fetch('/api/tools')
      if (!res.ok) return []
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes — tools list rarely changes
  })

  // Close popover on outside click
  useEffect(() => {
    if (!popoverOpen) return
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [popoverOpen])

  if (tools.length === 0) return null

  // Collapsed mode: icon button with popover flyout
  if (collapsed) {
    return (
      <div ref={popoverRef} className="relative px-1.5">
        <button
          onClick={() => setPopoverOpen(!popoverOpen)}
          title="Tools"
          className="flex items-center w-full rounded-lg text-sm font-medium transition-colors py-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <div className="w-8 flex items-center justify-center flex-shrink-0">
            <Wrench size={18} />
          </div>
        </button>

        {popoverOpen && (
          <div className="absolute left-12 bottom-0 z-50 w-56 max-h-80 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-1.5">
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              External Tools
            </p>
            {tools.map((tool) => (
              <a
                key={tool.id}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
              >
                <span className="flex-1 truncate">{tool.name}</span>
                <ExternalLink size={12} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
              </a>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Expanded mode: collapsible section
  return (
    <div className="px-1.5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center w-full rounded-lg text-sm font-medium transition-colors py-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <div className="w-8 flex items-center justify-center flex-shrink-0">
          <Wrench size={18} />
        </div>
        <span className="flex-1 text-left truncate ml-1">Tools</span>
        <ChevronDown
          size={14}
          className={`mr-2 transition-transform duration-200 ${expanded ? 'rotate-0' : '-rotate-90'}`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          expanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="ml-4 mt-1 space-y-0.5">
          {tools.map((tool) => (
            <a
              key={tool.id}
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50"
            >
              <span className="flex-1 truncate">{tool.name}</span>
              <ExternalLink size={12} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
