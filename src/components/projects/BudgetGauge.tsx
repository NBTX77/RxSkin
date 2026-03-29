'use client'

interface BudgetGaugeProps {
  budgetHours: number
  actualHours: number
  compact?: boolean
}

function getGaugeColor(percentage: number): string {
  if (percentage >= 100) return 'bg-red-500'
  if (percentage >= 80) return 'bg-yellow-500'
  return 'bg-green-500'
}

export function BudgetGauge({ budgetHours, actualHours, compact = false }: BudgetGaugeProps) {
  if (budgetHours <= 0) {
    return (
      <div className={compact ? 'text-xs text-gray-500' : 'text-xs text-gray-500 mb-2'}>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-1">
          <div className="h-full w-full bg-gray-600" />
        </div>
        <p>No budget set</p>
      </div>
    )
  }

  const percentage = (actualHours / budgetHours) * 100
  const gaugeColor = getGaugeColor(percentage)
  const cappedPercentage = Math.min(percentage, 100)

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${gaugeColor}`}
            style={{ width: `${cappedPercentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-gray-500">
          <span>{Math.round(actualHours)} / {Math.round(budgetHours)} hrs</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 mb-2">
      <div className="flex items-center justify-between text-sm text-gray-300">
        <span>Budget Hours</span>
        <span className="text-xs text-gray-500">
          {Math.round(actualHours)} / {Math.round(budgetHours)} ({Math.round(percentage)}%)
        </span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${gaugeColor}`}
          style={{ width: `${cappedPercentage}%` }}
        />
      </div>
    </div>
  )
}
