'use client'

import { useEffect, useRef } from 'react'
import {
  Folder,
  FileText,
  FileSpreadsheet,
  Image,
  File,
  Video,
  FileArchive,
  ExternalLink,
  Download,
  X,
} from 'lucide-react'
import type { DocumentItem } from '@/types/documents'
import { formatFileSize, getFileIcon } from '@/lib/graph/normalizers'

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

function formatDate(dateStr: string): string {
  if (!dateStr) return '--'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

// ── Component ──────────────────────────────────────────────────

interface DocumentPreviewProps {
  item: DocumentItem
  onClose: () => void
}

export function DocumentPreview({ item, onClose }: DocumentPreviewProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const Icon = resolveIcon(item)

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Delay registration to avoid instant close from the click that opened the panel
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 50)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handler)
    }
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40" />

      {/* Slide-out panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700/50 shadow-xl z-50 flex flex-col animate-slide-in-right"
        style={{
          animation: 'slideInRight 200ms ease-out forwards',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate pr-4">
            File Details
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close preview"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
          {/* File icon + name */}
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <Icon size={32} className="text-blue-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white break-all">
              {item.name}
            </h3>
            <div className="flex items-center gap-2">
              {item.extension && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase">
                  {item.extension}
                </span>
              )}
              {item.size !== null && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  {formatFileSize(item.size)}
                </span>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <DetailRow label="Last modified" value={formatDate(item.lastModifiedAt)} />
            <DetailRow label="Modified by" value={item.lastModifiedBy} />
            <DetailRow label="Created" value={formatDate(item.createdAt)} />
            <DetailRow label="Location" value={item.parentPath || '/'} />
            {item.mimeType && <DetailRow label="Type" value={item.mimeType} />}
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700/50 flex gap-3">
          {item.webUrl && (
            <a
              href={item.webUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <ExternalLink size={16} />
              Open in SharePoint
            </a>
          )}
          {item.downloadUrl && (
            <a
              href={item.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm font-medium transition-colors border border-gray-200 dark:border-gray-700/50"
            >
              <Download size={16} />
              Download
            </a>
          )}
        </div>
      </div>

      {/* Keyframe animation */}
      <style jsx global>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  )
}

// ── Detail Row ─────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-gray-500 dark:text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white text-right break-all">{value}</span>
    </div>
  )
}
