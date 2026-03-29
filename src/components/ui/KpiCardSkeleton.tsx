export function KpiCardSkeleton({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
      style={style}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="h-5 w-5 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
      </div>
      <div className="h-7 w-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
    </div>
  )
}
