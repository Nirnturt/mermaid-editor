"use client"

import React, { createContext, useContext, useState /*, useEffect*/ } from "react"
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

export function LanguageProvider({
  children,
  defaultLanguage = defaultLocale,
  storageKey = "mermaid-editor-language",
  ...props
}: LanguageProviderProps) {
  const [language, setLanguage] = useState<Locale>(
    () => {
      if (typeof localStorage !== "undefined") {
        const storedLanguage = localStorage.getItem(storageKey)
        if (storedLanguage && locales.includes(storedLanguage as Locale)) {
          return storedLanguage as Locale
        }
      }
      return defaultLanguage
    }
  )

  const value = {
    language,
    setLanguage: (language: Locale) => {
      localStorage.setItem(storageKey, language)
      setLanguage(language)
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