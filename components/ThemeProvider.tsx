'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useSettingsStore } from '@/store/settingsStore'

type Theme = 'light' | 'dark' | 'system'

interface ThemeProviderContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: 'light' | 'dark'
}

const ThemeProviderContext = createContext<ThemeProviderContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { settings, updateSettings } = useSettingsStore()
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light')

  const theme = settings.theme || 'system'
  const actualTheme = theme === 'system' ? systemTheme : theme

  const setTheme = (newTheme: Theme) => {
    updateSettings({ theme: newTheme })
  }

  // 시스템 테마 감지
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    // 초기값 설정
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')

    // 변경 감지
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // DOM에 테마 클래스 적용
  useEffect(() => {
    const root = document.documentElement

    if (actualTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [actualTheme])

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}