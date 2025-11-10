"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useLanguage } from "@/components/language-provider"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { LanguageSwitcher } from "@/components/language-switcher"
import { GitHubLogoIcon } from '@radix-ui/react-icons'
import { Button } from "@/components/ui/button"
import { motion } from "motion/react"
import { transitions, variants, interactions } from "@/config/motion"

export function Header() {
  const { language } = useLanguage()
  const [isMounted, setIsMounted] = useState(false)
  const [playEntrance, setPlayEntrance] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsMounted(true)
      setPlayEntrance(true)
    })
    return () => cancelAnimationFrame(frame)
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
      initial={variants.fadeInUp.initial}
      animate={playEntrance ? variants.fadeInUp.animate : variants.fadeInUp.initial}
      transition={transitions.entrance}
    >
      <div className="flex h-12 items-center justify-between px-2 md:px-4">
        <div className="flex items-center">
          <Link
            href="/"
            className="flex items-center space-x-1 text-muted-foreground transition-colors hover:text-foreground/70"
            aria-label={displayedTitle}
          >
            <motion.span
              className="flex items-center space-x-1"
              whileHover={interactions.hoverScale}
              whileTap={interactions.tapScale}
            >
              {/* Mermaid Icon Placeholder - Consider adding an actual SVG icon here */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span className="font-normal text-sm tracking-tight text-muted-foreground">{displayedTitle}</span>
            </motion.span>
          </Link>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-1">
          <nav className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground hover:bg-accent">
              <a
                href="https://github.com/Nirnturt/mermaid-editor" 
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
