"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useEditorStore } from "@/store/editor-store"
import { motion } from "motion/react"
import { transitions, variants } from "@/config/motion"
import { useLanguage } from "@/components/language-provider"
import { useTheme } from "@/components/theme-provider"
import CodeMirror from "@uiw/react-codemirror"
import { mermaid } from "codemirror-lang-mermaid"
import { githubLightInit, githubDarkInit } from "@uiw/codemirror-theme-github"
import { basicSetup } from "codemirror"
import { EditorView, placeholder as cmPlaceholder } from "@codemirror/view"

export function CodeInput() {
  const code = useEditorStore((state) => state.code)
  const setCode = useEditorStore((state) => state.setCode)
  const { language } = useLanguage()
  const { resolvedTheme } = useTheme()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])
  
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

  const editorBackground = isDarkMode
    ? getCSSVar('--background', '#171717')
    : getCSSVar('--card', '#ffffff')
  const foreground = isDarkMode
    ? getCSSVar('--foreground', '#f5f5f5')
    : getCSSVar('--foreground', '#171717')
  const accent = getCSSVar('--primary', isDarkMode ? '#60a5fa' : '#2563eb')
  const selection = isDarkMode ? 'rgba(148, 163, 184, 0.24)' : 'rgba(59, 130, 246, 0.18)'
  const gutterBorderColor = getCSSVar('--border', isDarkMode ? '#404040' : '#e5e5e5')
  const gutterText = getCSSVar('--muted-foreground', '#737373')

  const baseTheme = useMemo(() => {
    const settings = {
      background: editorBackground,
      foreground,
      caret: accent,
      selection,
      selectionMatch: selection,
      gutterBackground: editorBackground,
      gutterBorder: gutterBorderColor,
      lineHighlight: 'transparent',
    }
    return isDarkMode
      ? githubDarkInit({ settings })
      : githubLightInit({ settings })
  }, [accent, editorBackground, foreground, gutterBorderColor, selection, isDarkMode])

  const customEditorTheme = useMemo(
    () =>
      EditorView.theme(
        {
          "&": {
            height: "100%",
            fontSize: "14px",
            borderRadius: "0.375rem",
            outline: "none",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden !important",
          },
          ".cm-editor": {
            flexGrow: 1,
            overflow: "hidden !important",
            position: "relative",
            height: "100%",
          },
          ".cm-scroller": {
            overflow: "auto !important",
            fontFamily:
              "var(--font-mono, 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Fira Mono', 'Droid Sans Mono', 'Consolas', monospace)",
            height: "100%",
          },
          ".cm-gutters": {
            borderRight: `1px solid ${gutterBorderColor}`,
            color: gutterText,
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
            color: gutterText,
          },
          ".cm-content": {
            position: "relative",
            paddingTop: "12px",
            paddingBottom: "12px",
            paddingLeft: "12px",
            paddingRight: "12px",
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
            color: gutterText,
            fontStyle: "italic",
            display: "block !important",
            width: "100%",
            pointerEvents: "none",
            backgroundColor: "transparent !important",
            opacity: 0.6,
          },
        },
        { dark: isDarkMode }
      ),
    [gutterBorderColor, gutterText, isDarkMode]
  )

  const extensions = useMemo(
    () => [
      baseTheme,
      customEditorTheme,
      basicSetup,
      mermaid(),
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ spellcheck: "false" }),
      cmPlaceholder(isMounted ? placeholderText : "Loading..."),
    ],
    [baseTheme, customEditorTheme, isMounted, placeholderText]
  )

  return (
    <motion.div
      className={`w-full h-full ${isDarkMode ? "bg-background" : "bg-card"} border border-border shadow-xs rounded-md overflow-hidden relative code-input-container`}
      initial={variants.fadeInUp.initial}
      animate={isMounted ? variants.fadeInUp.animate : variants.fadeInUp.initial}
      transition={transitions.entrance}
    >
      {isMounted && (
        <CodeMirror
          value={code}
          height="100%"
          extensions={extensions}
          onChange={onChange}
          className="w-full h-full text-sm"
        />
      )}
    </motion.div>
  )
}
