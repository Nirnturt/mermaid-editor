"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { Locale, locales, defaultLocale } from "@/lib/i18n"

type LanguageProviderProps = {
  children: React.ReactNode
  defaultLanguage?: Locale
  storageKey?: string
}

type LanguageProviderState = {
  language: Locale
  setLanguage: (language: Locale) => void
}

const initialState: LanguageProviderState = {
  language: defaultLocale,
  setLanguage: () => null,
}

const LanguageProviderContext = createContext<LanguageProviderState>(initialState)

function safeGetLocale(key: string): Locale | null {
  if (typeof window === "undefined") {
    return null
  }
  try {
    const storedLanguage = window.localStorage.getItem(key)
    if (storedLanguage && locales.includes(storedLanguage as Locale)) {
      return storedLanguage as Locale
    }
  } catch (error) {
    console.warn("[LanguageProvider] 读取 localStorage 失败:", error)
  }
  return null
}

function safeSetLocale(key: string, value: Locale) {
  if (typeof window === "undefined") {
    return
  }
  try {
    window.localStorage.setItem(key, value)
  } catch (error) {
    console.warn("[LanguageProvider] 写入 localStorage 失败:", error)
  }
}

function detectBrowserLocale(): Locale | null {
  if (typeof navigator === "undefined") {
    return null
  }

  const navigatorLanguages = Array.isArray(navigator.languages) && navigator.languages.length > 0
    ? navigator.languages
    : [navigator.language]

  for (const candidate of navigatorLanguages) {
    if (!candidate) continue
    const normalized = candidate.toLowerCase()

    if (locales.includes(normalized as Locale)) {
      return normalized as Locale
    }

    const base = normalized.split("-")[0]
    if (base && locales.includes(base as Locale)) {
      return base as Locale
    }
  }

  return null
}

export function LanguageProvider({
  children,
  defaultLanguage = defaultLocale,
  storageKey = "mermaid-editor-language",
  ...props
}: LanguageProviderProps) {
  const [language, setLanguage] = useState<Locale>(defaultLanguage)
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

    const storedLanguage = safeGetLocale(storageKey)
    if (storedLanguage) {
      const cleanup = schedule(() => {
        setLanguage(storedLanguage)
        setHasHydrated(true)
      })
      return () => {
        cancelled = true
        cleanup()
      }
    }

    const browserDetected = detectBrowserLocale()
    if (browserDetected) {
      const cleanup = schedule(() => {
        setLanguage(browserDetected)
        safeSetLocale(storageKey, browserDetected)
        setHasHydrated(true)
      })
      return () => {
        cancelled = true
        cleanup()
      }
    }

    const cleanup = schedule(() => setHasHydrated(true))

    return () => {
      cancelled = true
      cleanup()
    }
  }, [storageKey])

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", language)
    }
  }, [language])

  useEffect(() => {
    if (!hasHydrated) {
      return
    }
    safeSetLocale(storageKey, language)
  }, [language, hasHydrated, storageKey])

  const value = {
    language,
    setLanguage: (nextLanguage: Locale) => {
      setLanguage(nextLanguage)
    },
  }

  return (
    <LanguageProviderContext.Provider {...props} value={value}>
      {children}
    </LanguageProviderContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageProviderContext)

  if (context === undefined)
    throw new Error("useLanguage must be used within a LanguageProvider")

  return context
} 
