"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "light" | "dark"
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  resolvedTheme: "light",
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

function isValidTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light" || value === "system"
}

function safeGetThemeFromStorage(key: string): Theme | null {
  if (typeof window === "undefined") {
    return null
  }
  try {
    const storedTheme = window.localStorage.getItem(key)
    return isValidTheme(storedTheme) ? storedTheme : null
  } catch (error) {
    console.warn("[ThemeProvider] 读取 localStorage 失败:", error)
    return null
  }
}

function safeSetThemeToStorage(key: string, value: Theme) {
  if (typeof window === "undefined") {
    return
  }
  try {
    window.localStorage.setItem(key, value)
  } catch (error) {
    console.warn("[ThemeProvider] 写入 localStorage 失败:", error)
  }
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "mermaid-editor-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(defaultTheme === "dark" ? "dark" : "light")
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    let cancelled = false
    const schedule = (cb: () => void) => {
      const frame = requestAnimationFrame(() => {
        if (!cancelled) {
          cb()
        }
      })
      return () => cancelAnimationFrame(frame)
    }

    const stored = safeGetThemeFromStorage(storageKey)
    if (stored) {
      const cleanup = schedule(() => {
        setThemeState(stored)
        setHasHydrated(true)
      })
      return () => {
        cancelled = true
        cleanup()
      }
    }

    const cleanup = schedule(() => {
      setThemeState(defaultTheme)
      setHasHydrated(true)
    })

    return () => {
      cancelled = true
      cleanup()
    }
  }, [defaultTheme, storageKey])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const root = window.document.documentElement
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const systemTheme = mediaQuery.matches ? "dark" : "light"
    const nextResolvedTheme = theme === "system" ? systemTheme : theme
    let frame: number | null = null
    const schedule = (cb: () => void) => {
      frame = requestAnimationFrame(() => {
        cb()
        frame = null
      })
    }
    const cleanupFrame = () => {
      if (frame !== null) {
        cancelAnimationFrame(frame)
        frame = null
      }
    }

    const applyTheme = (value: "light" | "dark") => {
      root.classList.remove("light", "dark")
      root.classList.add(value)
      root.dataset.theme = value
      root.style.colorScheme = value
      schedule(() => setResolvedTheme(value))
    }

    applyTheme(nextResolvedTheme)

    if (theme !== "system") {
      return () => {
        cleanupFrame()
      }
    }

    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      const updatedTheme = event.matches ? "dark" : "light"
      applyTheme(updatedTheme)
    }

    mediaQuery.addEventListener("change", handleSystemThemeChange)
    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange)
      cleanupFrame()
    }
  }, [theme])

  useEffect(() => {
    if (!hasHydrated) {
      return
    }
    safeSetThemeToStorage(storageKey, theme)
  }, [theme, storageKey, hasHydrated])

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      setThemeState(newTheme)
    },
    resolvedTheme,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
} 
