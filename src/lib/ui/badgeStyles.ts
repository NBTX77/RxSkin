// Shared badge style maps — single source of truth for priority, status, and project stage colors.
// All styles follow the light/dark theming pattern: base = light, dark: = dark override.

export const PRIORITY_BADGE_STYLES: Record<string, string> = {
  Critical: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
  High: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
  Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
  Low: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
}

export const PRIORITY_BORDER_COLORS: Record<string, string> = {
  Critical: 'border-l-red-500',
  High: 'border-l-orange-500',
  Medium: 'border-l-yellow-500',
  Low: 'border-l-blue-500',
}

export const PRIORITY_DOT_COLORS: Record<string, string> = {
  Critical: 'bg-red-500',
  High: 'bg-orange-500',
  Medium: 'bg-yellow-500',
  Low: 'bg-blue-500',
}

export const STATUS_BADGE_STYLES: Record<string, string> = {
  New: 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20',
  'In Progress': 'text-cyan-600 bg-cyan-50 border-cyan-200 dark:text-cyan-400 dark:bg-cyan-500/10 dark:border-cyan-500/20',
  Completed: 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-500/10 dark:border-green-500/20',
  Closed: 'text-gray-500 bg-gray-100 border-gray-200 dark:text-gray-500 dark:bg-gray-500/10 dark:border-gray-500/20',
  'Waiting on Client': 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-500/10 dark:border-yellow-500/20',
  Scheduled: 'text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-500/10 dark:border-purple-500/20',
  Escalated: 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20',
}

export const PROJECT_STAGE_STYLES: Record<string, string> = {
  '10 New': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  '20 Incomplete Handoff': 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
  '30 Assigned to PM': 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
  '31 In Service Work': 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800',
  '33 In Progress': 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800',
  '34 Active Work': 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800',
  '50 Completed': 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
}

export const BADGE_BASE_CLASSES = 'rounded-full text-xs font-medium px-2 py-0.5 border'

export function getPriorityBadgeStyle(priority?: string | null): string {
  return PRIORITY_BADGE_STYLES[priority ?? ''] ?? 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
}

export function getStatusBadgeStyle(status?: string | null): string {
  return STATUS_BADGE_STYLES[status ?? ''] ?? 'text-gray-500 bg-gray-100 border-gray-200 dark:text-gray-400 dark:bg-gray-500/10 dark:border-gray-500/20'
}

export function getProjectStageStyle(stage?: string | null): string {
  return PROJECT_STAGE_STYLES[stage ?? ''] ?? 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
}
