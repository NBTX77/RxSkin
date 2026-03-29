'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  MessageSquare,
  Eye,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  Save,
  MoreHorizontal,
  Loader2,
  X,
} from 'lucide-react'
import { KPICard } from '@/components/ui/KPICard'
import { useFeedbackList, useFeedbackUpdate, useFeedbackAnalyze } from '@/hooks/useFeedback'
import type { UserFeedback, FeedbackAdminStatus, FeedbackCategory } from '@/types/feedback'

// ── Constants ─────────────────────────────────────────────────

const ITEMS_PER_PAGE = 25

const STATUS_OPTIONS: { value: FeedbackAdminStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unreviewed', label: 'Unreviewed' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'to_implement', label: 'To Implement' },
  { value: 'wont_fix', label: "Won't Fix" },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'implemented', label: 'Implemented' },
]

const CATEGORY_OPTIONS: { value: FeedbackCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'bug', label: 'Bug' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'ux_issue', label: 'UX Issue' },
  { value: 'performance', label: 'Performance' },
  { value: 'other', label: 'Other' },
]

// ── Badge Helpers ─────────────────────────────────────────────

function statusBadgeClasses(status: FeedbackAdminStatus): string {
  const map: Record<FeedbackAdminStatus, string> = {
    unreviewed: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
    reviewed: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    to_implement: 'bg-green-500/10 text-green-600 dark:text-green-400',
    wont_fix: 'bg-red-500/10 text-red-600 dark:text-red-400',
    duplicate: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    implemented: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  }
  return map[status] ?? 'bg-gray-500/10 text-gray-500'
}

function statusLabel(status: FeedbackAdminStatus): string {
  const map: Record<FeedbackAdminStatus, string> = {
    unreviewed: 'Unreviewed',
    reviewed: 'Reviewed',
    to_implement: 'To Implement',
    wont_fix: "Won't Fix",
    duplicate: 'Duplicate',
    implemented: 'Implemented',
  }
  return map[status] ?? status
}

function categoryBadgeClasses(category: FeedbackCategory): string {
  const map: Record<FeedbackCategory, string> = {
    bug: 'bg-red-500/10 text-red-600 dark:text-red-400',
    feature_request: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    ux_issue: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    performance: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    other: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
  }
  return map[category] ?? 'bg-gray-500/10 text-gray-500'
}

function categoryLabel(category: FeedbackCategory): string {
  const map: Record<FeedbackCategory, string> = {
    bug: 'Bug',
    feature_request: 'Feature Request',
    ux_issue: 'UX Issue',
    performance: 'Performance',
    other: 'Other',
  }
  return map[category] ?? category
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// ── Main Page Component ───────────────────────────────────────

export default function AdminFeedbackPage() {
  // Filter state
  const [statusFilter, setStatusFilter] = useState<FeedbackAdminStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | 'all'>('all')
  const [pageFilter, setPageFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(0)

  // Expanded row
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Inline edit state for expanded row
  const [editNotes, setEditNotes] = useState('')
  const [editStatus, setEditStatus] = useState<FeedbackAdminStatus>('unreviewed')
  const [editLinkedTask, setEditLinkedTask] = useState('')

  // Actions dropdown
  const [actionsOpenId, setActionsOpenId] = useState<string | null>(null)

  // AI analysis panel
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<{
    analysis: string
    feedbackCount: number
    analyzedAt: string
  } | null>(null)

  // Hooks
  const { data, isLoading, isError } = useFeedbackList({
    status: statusFilter,
    category: categoryFilter,
    page: pageFilter || undefined,
    search: searchQuery || undefined,
    limit: ITEMS_PER_PAGE,
    offset: currentPage * ITEMS_PER_PAGE,
  })

  const updateMutation = useFeedbackUpdate()
  const analyzeMutation = useFeedbackAnalyze()

  const feedbackItems = useMemo(() => data?.data ?? [], [data?.data])
  const totalItems = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))

  // KPI calculations
  const kpis = useMemo(() => {
    const total = totalItems
    const unreviewed = feedbackItems.filter(f => f.adminStatus === 'unreviewed').length
    const toImplement = feedbackItems.filter(f => f.adminStatus === 'to_implement').length
    const positive = feedbackItems.filter(f => f.rating === 'positive').length
    const positiveRatio = feedbackItems.length > 0
      ? Math.round((positive / feedbackItems.length) * 100)
      : 0
    return { total, unreviewed, toImplement, positiveRatio }
  }, [feedbackItems, totalItems])

  // Unique pages from current data for filter dropdown
  const uniquePages = useMemo(() => {
    const pages = new Set(feedbackItems.map(f => f.page).filter(Boolean))
    return Array.from(pages).sort()
  }, [feedbackItems])

  // Expand row handler
  const handleExpandRow = useCallback((item: UserFeedback) => {
    if (expandedId === item.id) {
      setExpandedId(null)
    } else {
      setExpandedId(item.id)
      setEditNotes(item.adminNotes ?? '')
      setEditStatus(item.adminStatus)
      setEditLinkedTask(item.linkedTaskUrl ?? '')
    }
  }, [expandedId])

  // Save inline edits
  const handleSave = useCallback((id: string) => {
    updateMutation.mutate({
      id,
      adminStatus: editStatus,
      adminNotes: editNotes,
      linkedTaskUrl: editLinkedTask,
    })
    setExpandedId(null)
  }, [updateMutation, editStatus, editNotes, editLinkedTask])

  // Quick status change from actions dropdown
  const handleQuickStatus = useCallback((id: string, status: FeedbackAdminStatus) => {
    updateMutation.mutate({ id, adminStatus: status })
    setActionsOpenId(null)
  }, [updateMutation])

  // AI analysis
  const handleAnalyze = useCallback(() => {
    analyzeMutation.mutate(undefined, {
      onSuccess: (result) => {
        setAnalysisResult(result)
        setShowAnalysis(true)
      },
    })
  }, [analyzeMutation])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">User Feedback</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Review, tag, and analyze user feedback submissions
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          icon={MessageSquare}
          color="bg-blue-500"
          label="Total Submissions"
          value={kpis.total}
        />
        <KPICard
          icon={Eye}
          color="bg-amber-500"
          label="Unreviewed"
          value={kpis.unreviewed}
        />
        <KPICard
          icon={CheckCircle2}
          color="bg-green-500"
          label="Tagged to Implement"
          value={kpis.toImplement}
        />
        <KPICard
          icon={ThumbsUp}
          color="bg-cyan-500"
          label="Positive Ratio"
          value={`${kpis.positiveRatio}%`}
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Status pills */}
          <div className="flex flex-wrap gap-1.5 flex-1">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => { setStatusFilter(opt.value); setCurrentPage(0) }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === opt.value
                    ? 'bg-orange-500/15 text-orange-500 border border-orange-500/30'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-transparent'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Right side controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value as FeedbackCategory | 'all'); setCurrentPage(0) }}
              className="text-xs border border-gray-300 dark:border-gray-700/50 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            >
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Page dropdown */}
            <select
              value={pageFilter}
              onChange={(e) => { setPageFilter(e.target.value); setCurrentPage(0) }}
              className="text-xs border border-gray-300 dark:border-gray-700/50 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 max-w-[160px]"
            >
              <option value="">All Pages</option>
              {uniquePages.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search comments..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0) }}
                className="text-xs border border-gray-300 dark:border-gray-700/50 rounded-lg pl-8 pr-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 w-[180px]"
              />
            </div>

            {/* Analyze button */}
            <button
              onClick={handleAnalyze}
              disabled={analyzeMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-colors disabled:opacity-50"
            >
              {analyzeMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              Analyze with AI
            </button>
          </div>
        </div>
      </div>

      {/* AI Analysis Panel */}
      {showAnalysis && analysisResult && (
        <div className="bg-white dark:bg-gray-900 border border-purple-300 dark:border-purple-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-purple-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI Analysis</h3>
              <span className="text-xs text-gray-500">
                {analysisResult.feedbackCount} items analyzed at {formatDateTime(analysisResult.analyzedAt)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAnalyze}
                disabled={analyzeMutation.isPending}
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline disabled:opacity-50"
              >
                Run Again
              </button>
              <button onClick={() => setShowAnalysis(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={14} />
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            {analysisResult.analysis}
          </div>
        </div>
      )}

      {/* Feedback Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : isError ? (
          <div className="text-center py-16 text-red-500 text-sm">
            Failed to load feedback. Please try again.
          </div>
        ) : feedbackItems.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">
            No feedback submissions found.
          </div>
        ) : (
          <>
            {/* Table header — hidden on mobile */}
            <div className="hidden lg:grid lg:grid-cols-[100px_60px_120px_140px_1fr_120px_60px] gap-3 px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
              <span>Date</span>
              <span>Rating</span>
              <span>Category</span>
              <span>Page</span>
              <span>Comment</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            {/* Table rows */}
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {feedbackItems.map((item) => (
                <div key={item.id}>
                  {/* Row */}
                  <div
                    onClick={() => handleExpandRow(item)}
                    className="grid grid-cols-1 lg:grid-cols-[100px_60px_120px_140px_1fr_120px_60px] gap-2 lg:gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    {/* Date */}
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="lg:hidden font-medium text-gray-500 mr-1">Date:</span>
                      {formatDate(item.createdAt)}
                    </span>

                    {/* Rating */}
                    <span className="flex items-center">
                      <span className="lg:hidden text-xs font-medium text-gray-500 mr-1">Rating:</span>
                      {item.rating === 'positive' ? (
                        <ThumbsUp size={14} className="text-green-500" />
                      ) : (
                        <ThumbsDown size={14} className="text-red-500" />
                      )}
                    </span>

                    {/* Category */}
                    <span>
                      <span className="lg:hidden text-xs font-medium text-gray-500 mr-1">Category:</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${categoryBadgeClasses(item.category)}`}>
                        {categoryLabel(item.category)}
                      </span>
                    </span>

                    {/* Page */}
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate" title={item.page}>
                      <span className="lg:hidden font-medium text-gray-500 mr-1">Page:</span>
                      {item.page}
                    </span>

                    {/* Comment */}
                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                      <span className="lg:hidden font-medium text-gray-500 mr-1">Comment:</span>
                      {item.comment
                        ? item.comment.length > 80
                          ? `${item.comment.slice(0, 80)}...`
                          : item.comment
                        : '(no comment)'}
                    </span>

                    {/* Status */}
                    <span>
                      <span className="lg:hidden text-xs font-medium text-gray-500 mr-1">Status:</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${statusBadgeClasses(item.adminStatus)}`}>
                        {statusLabel(item.adminStatus)}
                      </span>
                    </span>

                    {/* Actions */}
                    <span className="relative flex items-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setActionsOpenId(actionsOpenId === item.id ? null : item.id)}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <MoreHorizontal size={14} className="text-gray-500" />
                      </button>

                      {actionsOpenId === item.id && (
                        <div className="absolute right-0 top-full mt-1 z-20 w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg shadow-lg py-1">
                          {STATUS_OPTIONS.filter(o => o.value !== 'all').map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => handleQuickStatus(item.id, opt.value as FeedbackAdminStatus)}
                              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                                item.adminStatus === opt.value
                                  ? 'text-orange-500 font-medium'
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </span>
                  </div>

                  {/* Expanded Detail */}
                  {expandedId === item.id && (
                    <div className="px-4 pb-4 pt-1 bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Left: Details */}
                        <div className="space-y-3">
                          {/* Full comment */}
                          <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Full Comment</label>
                            <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">
                              {item.comment || '(no comment provided)'}
                            </p>
                          </div>

                          {/* Screenshot */}
                          {item.screenshotUrl && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Screenshot</label>
                              <a
                                href={item.screenshotUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block mt-1 text-xs text-blue-500 hover:underline truncate"
                              >
                                {item.screenshotUrl}
                              </a>
                            </div>
                          )}

                          {/* Context info */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Page</label>
                              <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">{item.page}</p>
                            </div>
                            {item.component && (
                              <div>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Component</label>
                                <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">{item.component}</p>
                              </div>
                            )}
                            {item.viewport && (
                              <div>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Viewport</label>
                                <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">{item.viewport}</p>
                              </div>
                            )}
                            {item.department && (
                              <div>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Department</label>
                                <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">{item.department}</p>
                              </div>
                            )}
                            <div>
                              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Submitted</label>
                              <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">{formatDateTime(item.createdAt)}</p>
                            </div>
                            {item.reviewedAt && (
                              <div>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Reviewed</label>
                                <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">{formatDateTime(item.reviewedAt)}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Admin controls */}
                        <div className="space-y-3">
                          {/* Status dropdown */}
                          <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value as FeedbackAdminStatus)}
                              className="mt-1 w-full text-sm border border-gray-300 dark:border-gray-700/50 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                            >
                              {STATUS_OPTIONS.filter(o => o.value !== 'all').map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>

                          {/* Admin notes */}
                          <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Admin Notes</label>
                            <textarea
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              rows={3}
                              className="mt-1 w-full text-sm border border-gray-300 dark:border-gray-700/50 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 resize-none"
                              placeholder="Internal notes about this feedback..."
                            />
                          </div>

                          {/* Linked task URL */}
                          <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Linked Task URL</label>
                            <input
                              type="text"
                              value={editLinkedTask}
                              onChange={(e) => setEditLinkedTask(e.target.value)}
                              className="mt-1 w-full text-sm border border-gray-300 dark:border-gray-700/50 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                              placeholder="https://app.asana.com/..."
                            />
                          </div>

                          {/* Save button */}
                          <button
                            onClick={() => handleSave(item.id)}
                            disabled={updateMutation.isPending}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
                          >
                            {updateMutation.isPending ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Save size={14} />
                            )}
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500">
              Showing {currentPage * ITEMS_PER_PAGE + 1}–{Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalItems)} of {totalItems}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={14} className="text-gray-600 dark:text-gray-400" />
              </button>
              <span className="text-xs text-gray-600 dark:text-gray-400 px-2">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={14} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
