'use client'

import { useEffect, useRef } from 'react'

export interface ContextMenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}

interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // Adjust position to keep menu on screen
  const style: React.CSSProperties = {
    position: 'fixed',
    left: x,
    top: y,
    zIndex: 9999,
  }

  return (
    <div ref={menuRef} role="menu" style={style} className="min-w-[180px] bg-white dark:bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1">
      {items.map((item, i) => (
        <button
          key={i}
          role="menuitem"
          onClick={() => {
            if (!item.disabled) {
              item.onClick()
              onClose()
            }
          }}
          disabled={item.disabled}
          className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left transition-colors ${
            item.disabled
              ? 'text-gray-600 cursor-not-allowed'
              : item.danger
              ? 'text-red-400 hover:bg-red-500/10'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-800 hover:text-gray-900 dark:text-white'
          }`}
        >
          {item.icon && <span className="w-4 h-4 flex items-center justify-center">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  )
}
