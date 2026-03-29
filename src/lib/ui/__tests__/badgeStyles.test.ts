import { describe, it, expect } from 'vitest'
import {
  PRIORITY_BADGE_STYLES,
  STATUS_BADGE_STYLES,
  getPriorityBadgeStyle,
  getStatusBadgeStyle,
} from '../badgeStyles'

describe('badgeStyles', () => {
  it('has styles for all priority levels', () => {
    expect(PRIORITY_BADGE_STYLES.Critical).toBeDefined()
    expect(PRIORITY_BADGE_STYLES.High).toBeDefined()
    expect(PRIORITY_BADGE_STYLES.Medium).toBeDefined()
    expect(PRIORITY_BADGE_STYLES.Low).toBeDefined()
  })

  it('returns badge classes as strings', () => {
    expect(typeof PRIORITY_BADGE_STYLES.Critical).toBe('string')
    expect(PRIORITY_BADGE_STYLES.Critical).toContain('bg-')
  })

  it('has styles for common ticket statuses', () => {
    expect(STATUS_BADGE_STYLES.New).toBeDefined()
    expect(STATUS_BADGE_STYLES['In Progress']).toBeDefined()
    expect(STATUS_BADGE_STYLES.Completed).toBeDefined()
    expect(STATUS_BADGE_STYLES.Closed).toBeDefined()
  })

  it('getPriorityBadgeStyle returns fallback for unknown priority', () => {
    const fallback = getPriorityBadgeStyle('Unknown')
    expect(fallback).toContain('bg-gray')
  })

  it('getPriorityBadgeStyle handles null/undefined', () => {
    expect(getPriorityBadgeStyle(null)).toContain('bg-gray')
    expect(getPriorityBadgeStyle(undefined)).toContain('bg-gray')
  })

  it('getStatusBadgeStyle returns fallback for unknown status', () => {
    const fallback = getStatusBadgeStyle('NonExistent')
    expect(fallback).toContain('gray')
  })

  it('all priority styles include dark mode variants', () => {
    Object.values(PRIORITY_BADGE_STYLES).forEach((style) => {
      expect(style).toContain('dark:')
    })
  })
})
