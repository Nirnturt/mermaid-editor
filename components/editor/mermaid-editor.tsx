"use client"

import { useEffect, Suspense, useState } from "react"
import dynamic from "next/dynamic"
import { useLanguage } from "@/components/language-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEditorStore } from "@/store/editor-store"
import { Loader2 } from "lucide-react"
import enMessages from '@/messages/en.json';
import zhMessages from '@/messages/zh.json';

// 懒加载主要组件
const CodeInput = dynamic(
  () => import("@/components/editor/code-input").then((module) => ({ default: module.CodeInput })),
  { ssr: false }
)
const Preview = dynamic(
  () => import("@/components/editor/preview").then((module) => ({ default: module.Preview })),
  { ssr: false }
)
const ExportPanel = dynamic(
  () => import("@/components/editor/export-panel").then((module) => ({ default: module.ExportPanel })),
  { ssr: false }
)

// 加载中组件
const LoadingSpinner = ({ text = "Loading..." }: { text?: string }) => (
  <div className="flex items-center justify-center h-full p-8">
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  </div>
);

export function MermaidEditor() {
  const { language } = useLanguage()
  const [hydrated, setHydrated] = useState(() => useEditorStore.persist?.hasHydrated?.() ?? false)
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") {
      return false
    }
    return window.matchMedia("(min-width: 768px)").matches
  })

  useEffect(() => {
    const store = useEditorStore
    const rehydrate = async () => {
      try {
        await store.persist?.rehydrate?.()
      } finally {
        const current = store.getState()
        current.hydrateLegacyState?.()
        setHydrated(true)
      }
    }

    if (store.persist?.hasHydrated?.()) {
      store.getState().hydrateLegacyState()
      setHydrated(true)
      return
    }

    rehydrate()

    const unsub = store.persist?.onFinishHydration?.(() => {
      setHydrated(true)
    }) ?? null

    return () => {
      unsub?.()
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia === "undefined") {
      return
    }

    const mediaQuery = window.matchMedia("(min-width: 768px)")
    const updateMatch = () => setIsDesktop(mediaQuery.matches)
    updateMatch()
    mediaQuery.addEventListener("change", updateMatch)

    return () => mediaQuery.removeEventListener("change", updateMatch)
  }, [])
  
  const texts = language === 'zh' ? zhMessages : enMessages;
  const inputTabText = texts.editor.input;
  const previewTabText = texts.editor.preview;
  const loadingText = language === 'zh' ? '加载中...' : 'Loading...';

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoadingSpinner text={loadingText} />
      </div>
    )
  }

  const mobileLayout = (
    <div className="h-full">
      <Tabs defaultValue="input" className="h-full flex flex-col">
        <TabsList className="grid grid-cols-2 bg-muted p-1 rounded-md mb-2 shrink-0 w-full max-w-full mx-auto">
          <TabsTrigger value="input" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-sm py-1.5 text-sm font-medium min-w-0 flex-1 truncate">
            {inputTabText}
          </TabsTrigger>
          <TabsTrigger value="preview" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-sm py-1.5 text-sm font-medium min-w-0 flex-1 truncate">
            {previewTabText}
          </TabsTrigger>
        </TabsList>
        <div className="flex-grow overflow-hidden min-h-0">
          <TabsContent value="input" className="h-full">
            <Suspense fallback={<LoadingSpinner text={loadingText} />}>
              <CodeInput />
            </Suspense>
          </TabsContent>
          <TabsContent value="preview" className="h-full">
            <Suspense fallback={<LoadingSpinner text={loadingText} />}>
              <Preview />
            </Suspense>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )

  const desktopLayout = (
    <div className="flex gap-3 h-full">
      <div className="w-1/2 h-full relative">
        <Suspense fallback={<LoadingSpinner text={loadingText} />}>
          <CodeInput />
        </Suspense>
      </div>
      <div className="w-1/2 h-full relative">
        <Suspense fallback={<LoadingSpinner text={loadingText} />}>
          <Preview />
        </Suspense>
      </div>
    </div>
  )

  return (
    <div className="w-full h-full px-3 pb-3 mermaid-editor-container">
      {isDesktop ? desktopLayout : mobileLayout}

      <Suspense fallback={null}>
        <ExportPanel />
      </Suspense>
    </div>
  )
}
