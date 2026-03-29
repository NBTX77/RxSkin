export function TicketCardSkeleton({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      className="rounded-xl border-l-[3px] border-l-gray-300 dark:border-l-gray-700 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4"
      style={style}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-3 w-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
          </div>
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse mt-1.5" />
      </div>
      <div className="flex items-center gap-4 mt-3">
        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
      </div>
    </div>
  )
}
