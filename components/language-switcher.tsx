"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/components/language-provider"
import { locales } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Languages } from "lucide-react"
import { motion } from "framer-motion"

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // 界面文本（多语言）
  const languageNames = {
    en: {
      en: "English",
      zh: "Chinese",
      language: "Language"
    },
    zh: {
      en: "英文",
      zh: "中文",
      language: "语言"
    }
  }
  
  // 获取当前语言下的显示名称
  // const getText = (key: string) => languageData[language][key] || key;

  // Specific text for sr-only to ensure it defaults correctly pre-hydration
  const srOnlyLanguageText = isMounted ? languageNames[language]?.language : languageNames.en.language;

  return (
    <motion.div
      initial={isMounted ? { opacity: 0, scale: 0.9 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="flex items-center"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground hover:bg-accent w-9 h-9"
            aria-label={srOnlyLanguageText}
          >
            <Languages className="h-5 w-5" />
            <span className="sr-only">{srOnlyLanguageText}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[8rem]">
          {locales.map((locale) => (
            <DropdownMenuItem
              key={locale}
              onClick={() => setLanguage(locale)}
              className={isMounted && locale === language ? "bg-accent text-accent-foreground" : ""} 
            >
              {/* Render text based on current language, or default if not mounted */}
              <span>{isMounted ? languageNames[language]?.[locale] : languageNames.en[locale]}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  )
} 