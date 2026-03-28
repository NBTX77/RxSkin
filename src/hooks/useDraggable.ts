'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseDraggableOptions {
  /** sessionStorage key for persisting position */
  storageKey: string
  /** Default position if nothing saved */
  defaultPosition: { x: number; y: number }
  /** Minimum width to leave visible when dragged near edges */
  minVisible?: number
}

export function useDraggable({ storageKey, defaultPosition, minVisible = 100 }: UseDraggableOptions) {
  const [position, setPosition] = useState(defaultPosition)
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  // Load saved position on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey)
      if (raw) {
        const saved = JSON.parse(raw)
        if (typeof saved.x === 'number' && typeof saved.y === 'number') {
          setPosition(saved)
        }
      }
    } catch {}
  }, [storageKey])

  const onDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    dragOffset.current = {
      x: clientX - position.x,
      y: clientY - position.y,
    }
    setIsDragging(true)
  }, [position])

  useEffect(() => {
    if (!isDragging) return

    function onMove(e: MouseEvent | TouchEvent) {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

      const newX = Math.max(-minVisible, Math.min(window.innerWidth - minVisible, clientX - dragOffset.current.x))
      const newY = Math.max(0, Math.min(window.innerHeight - minVisible, clientY - dragOffset.current.y))

      setPosition({ x: newX, y: newY })
    }

    function onEnd() {
      setIsDragging(false)
      setPosition(prev => {
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(prev))
        } catch {}
        return prev
      })
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [isDragging, storageKey, minVisible])

  return { position, isDragging, onDragStart }
}
