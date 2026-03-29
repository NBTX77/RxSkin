import { Suspense } from 'react'
import { ProjectsClient } from '@/components/projects/ProjectsClient'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export const metadata = { title: 'Projects — RX Skin' }

export default function ProjectsPage() {
  return (
    <ErrorBoundary section="Projects">
      <Suspense fallback={<ProjectsSkeleton />}>
        <ProjectsClient />
      </Suspense>
    </ErrorBoundary>
  )
}

function ProjectsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-10 w-28 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex gap-2">
        <div className="h-9 w-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="h-9 w-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>

      {/* Content skeleton — kanban columns */}
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="min-w-[280px] w-[280px] bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-3 space-y-3"
          >
            <div className="h-5 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            {Array.from({ length: 2 }).map((_, j) => (
              <div
                key={j}
                className="h-28 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
