"use client"

import { useState, useEffect } from "react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Moon, Sun, Laptop } from "lucide-react"
import { useLanguage } from "./language-provider"
import { motion } from "motion/react"
import { transitions, variants } from "@/config/motion"

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { setTheme /*, theme*/ } = useTheme();
  const { language } = useLanguage();

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])
  
  const texts = {
    theme: language === 'zh' ? '主题' : 'Theme',
    light: language === 'zh' ? '浅色' : 'Light',
    dark: language === 'zh' ? '深色' : 'Dark',
    system: language === 'zh' ? '系统' : 'System',
  }

  // Default to English for sr-only text before hydration
  const srOnlyThemeText = mounted ? texts.theme : 'Theme';
  const lightText = mounted ? texts.light : 'Light';
  const darkText = mounted ? texts.dark : 'Dark';
  const systemText = mounted ? texts.system : 'System';

  return (
    <motion.div 
      initial={variants.scaleFade.initial}
      animate={mounted ? variants.scaleFade.animate : variants.scaleFade.initial}
      transition={transitions.quick}
      className="flex items-center"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground hover:bg-accent w-9 h-9"
            aria-label={srOnlyThemeText}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">{srOnlyThemeText}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[8rem]">
          <DropdownMenuItem onClick={() => setTheme("light")}>
            <Sun className="mr-2 h-4 w-4" />
            <span>{lightText}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            <Moon className="mr-2 h-4 w-4" />
            <span>{darkText}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            <Laptop className="mr-2 h-4 w-4" />
            <span>{systemText}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  )
} 
