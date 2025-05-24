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

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "mermaid-editor-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")
  const [isSSR, setIsSSR] = useState(true)

  // 初始化主题，避免SSR不一致
  useEffect(() => {
    setIsSSR(false)
    
    // 从localStorage读取主题设置
    const storedTheme = localStorage.getItem(storageKey) as Theme | null
    const initialTheme = storedTheme || defaultTheme
    setTheme(initialTheme)
    
    // 计算实际主题
    const calculateResolvedTheme = (currentTheme: Theme): "light" | "dark" => {
      if (currentTheme === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      }
      return currentTheme
    }
    
    const newResolvedTheme = calculateResolvedTheme(initialTheme)
    setResolvedTheme(newResolvedTheme)
    
    // 立即应用主题到DOM
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(newResolvedTheme)
    
    // 监听系统主题变化
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (initialTheme === "system") {
        const systemTheme = e.matches ? "dark" : "light"
        setResolvedTheme(systemTheme)
        root.classList.remove("light", "dark")
        root.classList.add(systemTheme)
      }
    }
    
    mediaQuery.addEventListener('change', handleSystemThemeChange)
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }, [defaultTheme, storageKey])

  // 当主题变化时更新DOM和resolvedTheme
  useEffect(() => {
    if (isSSR) return
    
    const root = window.document.documentElement
    let newResolvedTheme: "light" | "dark"
    
    if (theme === "system") {
      newResolvedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    } else {
      newResolvedTheme = theme
    }
    
    root.classList.remove("light", "dark")
    root.classList.add(newResolvedTheme)
    setResolvedTheme(newResolvedTheme)
    
    // 系统主题监听器
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        const systemTheme = e.matches ? "dark" : "light"
        root.classList.remove("light", "dark")
        root.classList.add(systemTheme)
        setResolvedTheme(systemTheme)
      }
    }
    
    if (theme === "system") {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme, isSSR])

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      if (!isSSR) {
        localStorage.setItem(storageKey, newTheme)
      }
      setTheme(newTheme)
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