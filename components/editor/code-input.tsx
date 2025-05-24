"use client"

import { useEffect, useState, useCallback } from "react"
import { useEditorStore } from "@/store/editor-store"
import { motion } from "framer-motion"
import { useLanguage } from "@/components/language-provider"
import { useTheme } from "@/components/theme-provider"
import CodeMirror from "@uiw/react-codemirror"
import { mermaid } from "codemirror-lang-mermaid"
import { githubLight, githubDark } from "@uiw/codemirror-theme-github"
import { basicSetup } from "codemirror"
import { EditorView, placeholder as cmPlaceholder } from "@codemirror/view"

export function CodeInput() {
  const { code, setCode } = useEditorStore()
  const { language } = useLanguage()
  const { resolvedTheme } = useTheme()
  const [isMounted, setIsMounted] = useState(false)
  const [themeReady, setThemeReady] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    // 延迟设置主题就绪状态，确保CSS变量已加载
    const timer = setTimeout(() => {
      setThemeReady(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // 监听主题变化，重新设置主题就绪状态
  useEffect(() => {
    if (isMounted) {
      setThemeReady(false)
      const timer = setTimeout(() => {
        setThemeReady(true)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [resolvedTheme, isMounted])
  
  const placeholderText = language === 'zh' ? 
    "在此处输入 Mermaid 代码..." : 
    "Enter Mermaid code here..."
  
  const onChange = useCallback((value: string) => {
    setCode(value)
  }, [setCode])

  // 使用更可靠的主题检测
  const isDarkMode = resolvedTheme === "dark"
  
  // 获取CSS变量的当前值，作为fallback
  const getCSSVar = useCallback((varName: string, fallback: string) => {
    if (typeof window === 'undefined') return fallback
    try {
      const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
      return value || fallback
    } catch {
      return fallback
    }
  }, [])

  const customEditorTheme = EditorView.theme({
    "&": {
      height: "100%",
      fontSize: "14px",
      borderRadius: "0.375rem",
      outline: "none",
      backgroundColor: isDarkMode 
        ? getCSSVar('--background', '#171717') 
        : getCSSVar('--card', '#ffffff'),
      display: "flex",
      flexDirection: "column",
      overflow: "hidden !important",
    },
    ".cm-editor": {
      flexGrow: 1,
      overflow: "hidden !important",
      position: "relative",
      height: "100%",
      backgroundColor: isDarkMode 
        ? getCSSVar('--background', '#171717') 
        : getCSSVar('--card', '#ffffff'),
    },
    ".cm-scroller": {
      overflow: "auto !important",
      fontFamily: "var(--font-mono, 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Fira Mono', 'Droid Sans Mono', 'Consolas', monospace)",
      height: "100%",
      backgroundColor: isDarkMode 
        ? getCSSVar('--background', '#171717') 
        : getCSSVar('--card', '#ffffff'),
    },
    ".cm-gutters": {
      backgroundColor: isDarkMode 
        ? getCSSVar('--background', '#171717') 
        : getCSSVar('--card', '#ffffff'),
      borderRight: `1px solid ${isDarkMode 
        ? getCSSVar('--border', '#404040') 
        : getCSSVar('--border', '#e5e5e5')}`,
      color: isDarkMode 
        ? getCSSVar('--muted-foreground', '#737373') 
        : getCSSVar('--muted-foreground', '#737373'),
    },
    ".cm-lineNumbers .cm-gutterElement": {
      paddingLeft: "8px",
      paddingRight: "2px",
      minWidth: "32px",
      fontSize: "10px",
      fontWeight: "400",
      opacity: "0.7",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      height: "100%",
    },
    ".cm-activeLineGutter": { 
      backgroundColor: isDarkMode 
        ? getCSSVar('--background', '#171717') 
        : getCSSVar('--card', '#ffffff'),
      color: isDarkMode 
        ? getCSSVar('--muted-foreground', '#a3a3a3') 
        : getCSSVar('--muted-foreground', '#737373'),
    },
    ".cm-content": {
      position: "relative", 
      paddingTop: "12px",
      paddingBottom: "12px",
      paddingLeft: "12px", 
      paddingRight: "12px",
      backgroundColor: isDarkMode 
        ? getCSSVar('--background', '#171717') 
        : getCSSVar('--card', '#ffffff'),
      color: isDarkMode 
        ? getCSSVar('--foreground', '#f5f5f5') 
        : getCSSVar('--foreground', '#171717'),
    },
    ".cm-line": { 
      backgroundColor: "transparent",
    },
    ".cm-activeLine": { 
      backgroundColor: "transparent",
    },
    ".cm-placeholder": { 
      position: "absolute",
      top: "12px", 
      left: "12px", 
      color: isDarkMode 
        ? getCSSVar('--muted-foreground', '#737373') 
        : getCSSVar('--muted-foreground', '#737373'),
      fontStyle: "italic",
      display: "block !important", 
      width: "100%", 
      pointerEvents: "none",
      backgroundColor: "transparent !important", 
      opacity: 0.6, 
    }
  }, {dark: isDarkMode});

  const extensions = [
    basicSetup,
    mermaid(),
    EditorView.lineWrapping,
    EditorView.contentAttributes.of({ spellcheck: "false" }),
    customEditorTheme,
    cmPlaceholder(isMounted ? placeholderText: "Loading...")
  ];
  
  return (
    <motion.div
      className={`w-full h-full ${isDarkMode ? "bg-background" : "bg-card"} border border-border shadow-xs rounded-md overflow-hidden relative code-input-container`}
      initial={isMounted ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      suppressHydrationWarning={true}
    >
      {isMounted && themeReady && (
        <CodeMirror
          value={code}
          height="100%"
          theme={isDarkMode ? githubDark : githubLight}
          extensions={extensions}
          onChange={onChange}
          className="w-full h-full text-sm"
        />
      )}
      {isMounted && !themeReady && (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          <div className="animate-pulse">加载中...</div>
        </div>
      )}
    </motion.div>
  )
} 