"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/components/language-provider"
import { motion } from "motion/react"
import { transitions, variants } from "@/config/motion"

export function Footer() {
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
  
  const i18nTexts = {
    en: {
      powered: 'Powered by:',
      copyright: 'Copyright'
    },
    zh: {
      powered: '由下列技术提供支持：',
      copyright: '版权所有'
    }
  }

  const currentTexts = isMounted ? i18nTexts[language] : i18nTexts.en;

  return (
    <motion.footer 
      className="border-t border-border/50 bg-background/80 py-8 md:py-10 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      initial={variants.fadeInUp.initial}
      animate={playEntrance ? variants.fadeInUp.animate : variants.fadeInUp.initial}
      transition={{ ...transitions.linger, delay: 0.12 }}
    >
      <div className="container flex flex-col md:flex-row items-center justify-between text-sm px-4 md:px-6">
        <div className="mb-4 md:mb-0 text-center md:text-left">
          <p className="text-muted-foreground">
            {currentTexts.powered} 
            <a href="https://mermaid.js.org/" target="_blank" rel="noreferrer" className="font-medium text-foreground/80 hover:text-foreground transition-colors underline underline-offset-4">Mermaid.js</a>, 
            <a href="https://nextjs.org/" target="_blank" rel="noreferrer" className="font-medium text-foreground/80 hover:text-foreground transition-colors underline underline-offset-4 ml-1">Next.js</a>, 
            <a href="https://tailwindcss.com/" target="_blank" rel="noreferrer" className="font-medium text-foreground/80 hover:text-foreground transition-colors underline underline-offset-4 ml-1">Tailwind CSS</a>
          </p>
        </div>
        <div className="text-center md:text-right">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} {currentTexts.copyright}
          </p>
        </div>
      </div>
    </motion.footer>
  )
} 
