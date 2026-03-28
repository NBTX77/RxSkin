'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')

  // On mount, read from cookie and apply class
  useEffect(() => {
    const stored = document.cookie
      .split('; ')
      .find(row => row.startsWith('rx-theme='))
      ?.split('=')[1] as Theme | undefined

    const initial = stored === 'light' ? 'light' : 'dark'
    setThemeState(initial)
    document.documentElement.classList.remove('dark', 'light')
    document.documentElement.classList.add(initial)
  }, [])

  const applyTheme = useCallback((next: Theme) => {
    setThemeState(next)
    document.documentElement.classList.remove('dark', 'light')
    document.documentElement.classList.add(next)
    document.cookie = `rx-theme=${next};path=/;max-age=31536000;SameSite=Lax`
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      document.documentElement.classList.remove('dark', 'light')
      document.documentElement.classList.add(next)
      document.cookie = `rx-theme=${next};path=/;max-age=31536000;SameSite=Lax`
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme: applyTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
