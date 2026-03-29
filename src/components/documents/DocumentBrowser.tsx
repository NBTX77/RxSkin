'use client'

// ============================================================
// DocumentBrowser — RX Skin
// SharePoint Document Hub browser with breadcrumb navigation,
// search, file/folder table, and slide-out preview panel.
// ============================================================

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Folder,
  FileText,
  FileSpreadsheet,
  Image,
  File,
  Video,
  FileArchive,
  Search,
  ExternalLink,
  ChevronRight,
  FolderOpen,
  RefreshCw,
  AlertTriangle,
  Settings,
} from 'lucide-react'
import { useDocumentList } from '@/hooks/useDocuments'
import { formatFileSize, getFileIcon } from '@/lib/graph/normalizers'
import { DocumentPreview } from '@/components/documents/DocumentPreview'
import type { DocumentItem, BreadcrumbSegment } from '@/types/documents'

// ── Icon resolver ──────────────────────────────────────────────

const ICON_MAP: Record<string, typeof File> = {
  Folder,
  FileText,
  FileSpreadsheet,
  Image,
  Video,
  FileArchive,
  File,
}

function resolveIcon(item: DocumentItem) {
  const iconName = getFileIcon(item.extension, item.type)
  return ICON_MAP[iconName] ?? File
}

// ── Helpers ────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return '--'
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 7) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }
    if (diffDays >= 1) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    if (diffHours >= 1) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffMins >= 1) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    return 'Just now'
  } catch {
    return dateStr
  }
}

function sortItems(items: DocumentItem[]): DocumentItem[] {
  return [...items].sort((a, b) => {
    // Folders first
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
    // Then alphabetical
    return a.name.localeCompare(b.name)
  })
}

// ── Loading Skeleton ───────────────────────────────────────────

function DocumentSkeleton() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
        <div>
          <div className="h-8 w-56 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-4 w-40 bg-gray-200 dark:bg-gray-800 rounded mt-2" />
        </div>
        <div className="h-10 w-full max-w-sm bg-gray-200 dark:bg-gray-800 rounded-lg" />
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="flex-1">
                <div className="h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded hidden sm:block" />
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded hidden md:block" />
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded hidden md:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Error State ────────────────────────────────────────────────

function DocumentError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const isConfigError =
    message.includes('AZURE') ||
    message.includes('configure') ||
    message.includes('401') ||
    message.includes('403') ||
    message.includes('Graph')

  if (isConfigError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-yellow-50 dark:bg-yellow-950/30 flex items-center justify-center mb-4">
          <Settings size={32} className="text-yellow-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          SharePoint Not Configured
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mb-4">
          The Document Hub requires Azure AD credentials with Microsoft Graph access.
          Go to Admin &rarr; Integrations to configure your Azure AD application.
        </p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-4">
        <AlertTriangle size={32} className="text-red-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Failed to load documents
      </h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </button>
    </div>
  )
}

// ── Empty State ────────────────────────────────────────────────

function EmptyFolder() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <FolderOpen size={28} className="text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">This folder is empty</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">No files or folders here yet.</p>
    </div>
  )
}

// ── Breadcrumb ─────────────────────────────────────────────────

function Breadcrumb({
  segments,
  onNavigate,
}: {
  segments: BreadcrumbSegment[]
  onNavigate: (folderId: string | null) => void
}) {
  return (
    <nav className="flex items-center gap-1 text-sm overflow-x-auto min-w-0" aria-label="Breadcrumb">
      {segments.map((seg, idx) => {
        const isLast = idx === segments.length - 1
        return (
          <span key={seg.id ?? 'root'} className="flex items-center gap-1 min-w-0">
            {idx > 0 && <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />}
            {isLast ? (
              <span className="text-gray-900 dark:text-white font-medium truncate">{seg.name}</span>
            ) : (
              <button
                onClick={() => onNavigate(seg.id)}
                className="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors truncate"
              >
                {seg.name}
              </button>
            )}
          </span>
        )
      })}
    </nav>
  )
}

// ── Main Component ─────────────────────────────────────────────

export function DocumentBrowser() {
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<DocumentItem | null>(null)

  // Debounce search input by 400ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Clear search when navigating folders
  const navigateToFolder = useCallback((folderId: string | null) => {
    setCurrentFolderId(folderId ?? undefined)
    setSearchInput('')
    setDebouncedSearch('')
    setSelectedItem(null)
  }, [])

  const { data, isLoading, isError, error, refetch } = useDocumentList(
    currentFolderId,
    debouncedSearch || undefined
  )

  const sortedItems = useMemo(() => {
    if (!data?.items) return []
    return sortItems(data.items)
  }, [data?.items])

  const breadcrumb = data?.breadcrumb ?? [{ id: null, name: 'Documents' }]

  // Handle item click
  const handleItemClick = useCallback((item: DocumentItem) => {
    if (item.type === 'folder') {
      setCurrentFolderId(item.id)
      setSearchInput('')
      setDebouncedSearch('')
      setSelectedItem(null)
    } else {
      setSelectedItem(item)
    }
  }, [])

  if (isLoading) return <DocumentSkeleton />
  if (isError) {
    return (
      <DocumentError
        message={error instanceof Error ? error.message : 'An unexpected error occurred'}
        onRetry={() => refetch()}
      />
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8 space-y-5">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documents</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              SharePoint document library
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <a
              href="https://rxtechnology.sharepoint.com/sites/MissionControl"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open in SharePoint</span>
            </a>
          </div>
        </div>

        {/* BREADCRUMB + SEARCH ROW */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Breadcrumb segments={breadcrumb} onNavigate={navigateToFolder} />
          <div className="sm:ml-auto relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
        </div>

        {/* FILE TABLE */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg overflow-hidden">
          {sortedItems.length === 0 ? (
            <EmptyFolder />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Modified
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                        Modified By
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                        Size
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {sortedItems.map((item) => {
                      const Icon = resolveIcon(item)
                      const isFolder = item.type === 'folder'
                      return (
                        <tr
                          key={item.id}
                          onClick={() => handleItemClick(item)}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <Icon
                                size={20}
                                className={
                                  isFolder
                                    ? 'text-yellow-500 flex-shrink-0'
                                    : 'text-blue-500 flex-shrink-0'
                                }
                              />
                              <span className="font-medium text-gray-900 dark:text-white truncate">
                                {item.name}
                              </span>
                              {isFolder && item.childCount !== null && (
                                <span className="text-xs text-gray-400 flex-shrink-0">
                                  {item.childCount} item{item.childCount !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {formatRelativeTime(item.lastModifiedAt)}
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell whitespace-nowrap">
                            {item.lastModifiedBy}
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-right hidden md:table-cell whitespace-nowrap">
                            {isFolder ? '--' : formatFileSize(item.size)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
                {sortedItems.map((item) => {
                  const Icon = resolveIcon(item)
                  const isFolder = item.type === 'folder'
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <Icon
                        size={24}
                        className={isFolder ? 'text-yellow-500 flex-shrink-0' : 'text-blue-500 flex-shrink-0'}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatRelativeTime(item.lastModifiedAt)}
                          {!isFolder && item.size !== null && ` \u00B7 ${formatFileSize(item.size)}`}
                          {isFolder && item.childCount !== null && ` \u00B7 ${item.childCount} item${item.childCount !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                      {isFolder && (
                        <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Preview panel */}
      {selectedItem && (
        <DocumentPreview item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  )
}
