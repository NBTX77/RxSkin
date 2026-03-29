import type { ReactNode } from 'react'

interface SectionHeaderProps {
  title: string
  action?: ReactNode
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
        {title}
      </h2>
      {action && <div>{action}</div>}
    </div>
  )
}
