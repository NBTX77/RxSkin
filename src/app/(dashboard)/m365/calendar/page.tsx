'use client'

export const dynamic = 'force-dynamic'

// ============================================================
// M365 Calendar Page — RX Skin
// FullCalendar integration with Microsoft Graph calendar events.
// Day / Week / Month views, event detail overlay, create/edit modal.
// ============================================================

import { useCallback, useMemo, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventInput, EventClickArg, DateSelectArg } from '@fullcalendar/core'
import type { M365Event } from '@/types/m365'
import { M365EventDetail } from '@/components/m365/M365EventDetail'
import { M365CreateEvent } from '@/components/m365/M365CreateEvent'
import { ChevronLeft, ChevronRight, RefreshCw, Loader2, Plus, Calendar, AlertCircle } from 'lucide-react'
import '@/components/schedule/calendar-theme.css'

type ViewMode = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'

const VIEW_LABELS: Record<ViewMode, string> = {
  timeGridDay: 'Day',
  timeGridWeek: 'Week',
  dayGridMonth: 'Month',
}

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
  extendedProps: {
    location?: string
    organizer?: { name: string; address: string }
    attendees?: { name: string; address: string; response: string }[]
    onlineMeetingUrl?: string
    bodyPreview?: string
    isOnlineMeeting?: boolean
  }
}

export default function M365CalendarPage() {
  const calendarRef = useRef<FullCalendar>(null)
  const queryClient = useQueryClient()

  // View state
  const [currentView, setCurrentView] = useState<ViewMode>('timeGridWeek')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)
    return {
      start: startOfWeek.toISOString(),
      end: endOfWeek.toISOString(),
    }
  })

  // Selected event for detail overlay
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  // Create/edit modal
  const [createModal, setCreateModal] = useState<{
    defaultStart?: string
    defaultEnd?: string
    editEvent?: CalendarEvent['extendedProps'] & { id: string; subject: string; start: string; end: string; allDay: boolean }
  } | null>(null)

  // Fetch events from BFF
  const { data, isLoading, isFetching, refetch, error } = useQuery<{ events: M365Event[]; nextLink?: string }>({
    queryKey: ['m365', 'calendar', dateRange.start, dateRange.end],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDateTime: dateRange.start,
        endDateTime: dateRange.end,
        top: '200',
      })
      const res = await fetch(`/api/m365/calendar?${params}`)
      if (res.status === 403) {
        const body = await res.json().catch(() => ({}))
        throw new M365NotConnectedError(body.message || 'Microsoft 365 not connected')
      }
      if (!res.ok) throw new Error('Failed to fetch calendar events')
      return res.json()
    },
    staleTime: 30_000,
    refetchInterval: 120_000,
    retry: (failureCount, err) => {
      if (err instanceof M365NotConnectedError) return false
      return failureCount < 2
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await fetch(`/api/m365/calendar/${eventId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete event')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['m365', 'calendar'] })
      setSelectedEvent(null)
    },
  })

  // Map M365 events to FullCalendar format
  const events: EventInput[] = useMemo(() => {
    if (!data?.events) return []
    return data.events.map((event) => ({
      id: event.id,
      title: event.subject,
      start: event.start.dateTime,
      end: event.end.dateTime,
      allDay: false, // Graph API returns isAllDay separately; we check via time
      backgroundColor: '#3b82f6',
      borderColor: '#3b82f6',
      extendedProps: {
        location: event.location?.displayName || undefined,
        organizer: event.organizer?.emailAddress
          ? { name: event.organizer.emailAddress.name, address: event.organizer.emailAddress.address }
          : undefined,
        attendees: event.attendees?.map((att) => ({
          name: att.emailAddress.name,
          address: att.emailAddress.address,
          response: att.status.response,
        })),
        onlineMeetingUrl: event.onlineMeeting?.joinUrl || undefined,
        bodyPreview: event.bodyPreview || undefined,
        isOnlineMeeting: event.isOnlineMeeting,
      },
    }))
  }, [data])

  // Handle FullCalendar date range change
  const handleDatesSet = useCallback((dateInfo: { start: Date; end: Date }) => {
    setDateRange({
      start: dateInfo.start.toISOString(),
      end: dateInfo.end.toISOString(),
    })
  }, [])

  // Handle event click
  const handleEventClick = useCallback((info: EventClickArg) => {
    const ev = info.event
    const calEvent: CalendarEvent = {
      id: ev.id,
      title: ev.title,
      start: ev.start?.toISOString() || '',
      end: ev.end?.toISOString() || ev.start?.toISOString() || '',
      allDay: ev.allDay,
      extendedProps: ev.extendedProps as CalendarEvent['extendedProps'],
    }
    setSelectedEvent(calEvent)
  }, [])

  // Handle empty slot click (date select)
  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    setCreateModal({
      defaultStart: selectInfo.startStr,
      defaultEnd: selectInfo.endStr,
    })
  }, [])

  // Handle edit from detail overlay
  const handleEdit = useCallback((eventId: string) => {
    const ev = selectedEvent
    if (!ev || ev.id !== eventId) return
    setSelectedEvent(null)
    setCreateModal({
      editEvent: {
        id: ev.id,
        subject: ev.title,
        start: ev.start,
        end: ev.end,
        allDay: ev.allDay,
        location: ev.extendedProps.location,
        isOnlineMeeting: ev.extendedProps.isOnlineMeeting,
        attendees: ev.extendedProps.attendees,
        bodyPreview: ev.extendedProps.bodyPreview,
      },
    })
  }, [selectedEvent])

  // Handle delete from detail overlay
  const handleDelete = useCallback((eventId: string) => {
    deleteMutation.mutate(eventId)
  }, [deleteMutation])

  // Navigation
  const handlePrev = () => {
    calendarRef.current?.getApi().prev()
  }
  const handleNext = () => {
    calendarRef.current?.getApi().next()
  }
  const handleToday = () => {
    calendarRef.current?.getApi().today()
  }
  const handleViewChange = (view: ViewMode) => {
    setCurrentView(view)
    calendarRef.current?.getApi().changeView(view)
  }

  const calendarTitle = calendarRef.current?.getApi()?.view.title ?? ''

  // Not connected state
  const isNotConnected = error instanceof M365NotConnectedError

  if (isNotConnected) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-12 text-center">
          <div className="rounded-full bg-blue-50 dark:bg-blue-500/10 p-4 mb-4">
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Connect Microsoft 365
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mb-6">
            Connect your Microsoft account to view and manage your Outlook calendar events.
            Go to Settings and connect your Microsoft 365 account.
          </p>
          <a
            href="/settings"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
          >
            Go to Settings
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-3" data-feedback-component="M365Calendar">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Calendar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Microsoft 365 Outlook Calendar</p>
        </div>
        <button
          onClick={() => setCreateModal({})}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          New Event
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Nav buttons + title */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            className="rounded-md border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleToday}
            className="rounded-md border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Today
          </button>
          <button
            onClick={handleNext}
            className="rounded-md border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <h2 className="ml-1 text-sm font-medium text-gray-900 dark:text-white sm:text-base whitespace-nowrap">
            {calendarTitle}
          </h2>
        </div>

        {/* Spacer */}
        <div className="hidden sm:flex flex-1" />

        {/* View switcher */}
        <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-0.5">
          {(Object.entries(VIEW_LABELS) as [ViewMode, string][]).map(([view, label]) => (
            <button
              key={view}
              onClick={() => handleViewChange(view)}
              className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                currentView === view
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-md border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          title="Refresh calendar"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error (non-auth) */}
      {error && !isNotConnected && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error.message}
        </div>
      )}

      {/* Calendar */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-2 sm:p-4 overflow-x-auto min-w-0">
        {isLoading ? (
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="rx-calendar">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={currentView}
              headerToolbar={false}
              events={events}
              editable={false}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              nowIndicator={true}
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              slotDuration="00:30:00"
              expandRows={true}
              height="auto"
              contentHeight={600}
              allDaySlot={true}
              eventClick={handleEventClick}
              select={handleDateSelect}
              datesSet={handleDatesSet}
              eventContent={(arg) => (
                <div className="flex flex-col overflow-hidden px-1 py-0.5">
                  <span className="truncate text-xs font-medium">
                    {arg.event.title}
                  </span>
                  {arg.event.extendedProps.location && (
                    <span className="truncate text-[10px] opacity-75">
                      {arg.event.extendedProps.location}
                    </span>
                  )}
                </div>
              )}
            />
          </div>
        )}
      </div>

      {/* Event detail overlay */}
      {selectedEvent && (
        <M365EventDetail
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      )}

      {/* Create/edit modal */}
      {createModal && (
        <M365CreateEvent
          onClose={() => setCreateModal(null)}
          defaultStart={createModal.defaultStart}
          defaultEnd={createModal.defaultEnd}
          editEvent={createModal.editEvent}
        />
      )}
    </div>
  )
}

// Custom error for 403 not-connected state
class M365NotConnectedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'M365NotConnectedError'
  }
}
