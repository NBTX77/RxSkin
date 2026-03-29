'use client'

// ============================================================
// ClientHealthScore — RX Skin
// Circular gauge showing 0-100 health score with grade letter.
// Used in CBRClientDetail header.
// ============================================================

interface ClientHealthScoreProps {
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  size?: 'sm' | 'md' | 'lg'
}

function getGradeColor(score: number): string {
  if (score >= 75) return '#10b981' // green
  if (score >= 60) return '#eab308' // yellow
  if (score >= 40) return '#f97316' // orange
  return '#ef4444' // red
}

export function ClientHealthScore({ score, grade, size = 'lg' }: ClientHealthScoreProps) {
  const color = getGradeColor(score)
  const dimensions = size === 'lg' ? 120 : size === 'md' ? 80 : 56
  const strokeWidth = size === 'lg' ? 8 : size === 'md' ? 6 : 4
  const radius = (dimensions - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const scoreFontSize = size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-xl' : 'text-sm'
  const gradeFontSize = size === 'lg' ? 'text-sm' : size === 'md' ? 'text-xs' : 'text-[10px]'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: dimensions, height: dimensions }}>
      <svg
        width={dimensions}
        height={dimensions}
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Background ring */}
        <circle
          cx={dimensions / 2}
          cy={dimensions / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress ring */}
        <circle
          cx={dimensions / 2}
          cy={dimensions / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`${scoreFontSize} font-bold text-gray-900 dark:text-white leading-none`}>
          {score}
        </span>
        <span
          className={`${gradeFontSize} font-semibold leading-tight mt-0.5`}
          style={{ color }}
        >
          {grade}
        </span>
      </div>
    </div>
  )
}
