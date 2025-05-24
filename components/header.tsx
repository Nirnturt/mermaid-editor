"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/components/language-provider"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { LanguageSwitcher } from "@/components/language-switcher"
import { GitHubLogoIcon } from '@radix-ui/react-icons'
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export function Header() {
  const { language } = useLanguage()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  const texts = {
    title: language === 'zh' ? 'Mermaid 编辑器' : 'Mermaid Editor',
    github: language === 'zh' ? 'GitHub' : 'GitHub'
  }

  // Render a placeholder or default text until mounted
  const displayedTitle = isMounted ? texts.title : 'Mermaid Editor'; // Default to English title pre-hydration

  return (
    <motion.header 
      className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      initial={isMounted ? { y: -20, opacity: 0 } : false}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex h-12 items-center justify-between px-2 md:px-4">
        <div className="flex items-center">
          <motion.a 
            href="/" 
            className="flex items-center space-x-1 text-muted-foreground hover:text-foreground/70 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Mermaid Icon Placeholder - Consider adding an actual SVG icon here */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <span className="font-normal text-sm tracking-tight text-muted-foreground">{displayedTitle}</span>
          </motion.a>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-1">
          <nav className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground hover:bg-accent">
              <a
                href="https://github.com/mermaid-js/mermaid" 
                target="_blank"
                rel="noreferrer"
                aria-label={isMounted ? texts.github : 'GitHub'}
              >
                <GitHubLogoIcon className="h-5 w-5" />
                <span className="sr-only">{isMounted ? texts.github : 'GitHub'}</span>
              </a>
            </Button>
            <ThemeSwitcher />
            <LanguageSwitcher />
          </nav>
        </div>
      </div>
    </motion.header>
  )
} 