'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Calendar, Loader2, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface ScheduleEntry {
  id: number
  title: string
  summary?: string
  objectId?: string
  dateStart: string
  dateEnd: string
  type?: string
  status?: string
  resource?: {
    identifier: string
  }
}

export default function SchedulePage() {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week')
  const [selectedDate, setSelectedDate] = useState(new Date())

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['/api/schedule', selectedDate.toISOString().split('T')[0], viewMode],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('date', selectedDate.toISOString().split('T')[0])
      params.append('view', viewMode)

      const res = await fetch(`/api/schedule?${params}`)
      if (!res.ok) throw new Error('Failed to fetch schedule')
      return res.json()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const goToToday = () => setSelectedDate(new Date())

  const previousDate = () => {
    const newDate = new Date(selectedDate)
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setSelectedDate(newDate)
  }

  const nextDate = () => {
    const newDate = new Date(selectedDate)
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setSelectedDate(newDate)
  }

  return (
    <main className="flex-1 overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-4">Schedule</h1>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Date navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={previousDate}
                className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm hover:bg-gray-700 transition-colors"
              >
                ← Previous
              </button>
              <span className="text-sm text-gray-400 px-3 py-2 min-w-fit">
                {selectedDate.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <button
                onClick={nextDate}
                className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm hover:bg-gray-700 transition-colors"
              >
                Next →
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
              >
                Today
              </button>
            </div>

            {/* View mode toggle */}
            <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
              {(['day', 'week', 'month'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors capitalize ${
                    viewMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 size={20} className="text-gray-400 animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <Calendar size={32} className="mx-auto text-gray-700 mb-3" />
              <p className="text-gray-400">No scheduled entries for this period</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry: ScheduleEntry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-800/80 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white mb-1 truncate">{entry.title}</h3>
                      {entry.summary && (
                        <p className="text-sm text-gray-400 mb-2">{entry.summary}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Clock size={14} />
                          <span>
                            {formatTime(entry.dateStart)} – {formatTime(entry.dateEnd)}
                          </span>
                        </div>
                        {entry.resource && (
                          <span className="text-gray-400">
                            {entry.resource.identifier}
                          </span>
                        )}
                        {entry.type && (
                          <span className="px-2 py-0.5 rounded bg-gray-700 text-gray-300 text-xs">
                            {entry.type}
                          </span>
                        )}
                      </div>
                    </div>
                    {entry.status === 'Completed' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 flex-shrink-0">
                        Completed
                      </span>
                    ) : entry.status === 'Confirmed' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 flex-shrink-0">
                        Confirmed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex-shrink-0">
                        {entry.status || 'Pending'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info banner */}
          <div className="mt-6 p-4 rounded-lg bg-gray-800 border border-gray-700 flex gap-3">
            <AlertCircle size={18} className="text-gray-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-400">
              Calendar drag-and-drop scheduling will be available in the next release.
              For now, use ConnectWise Manage to modify schedule entries.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
