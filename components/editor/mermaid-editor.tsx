"use client"

import { useState, useEffect, Suspense, lazy } from "react"
import { useLanguage } from "@/components/language-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEditorStore } from "@/store/editor-store"
import { Loader2 } from "lucide-react"
import enMessages from '@/messages/en.json';
import zhMessages from '@/messages/zh.json';

// 懒加载主要组件
const CodeInput = lazy(() => import("@/components/editor/code-input").then(module => ({ default: module.CodeInput })));
const Preview = lazy(() => import("@/components/editor/preview").then(module => ({ default: module.Preview })));
const ExportPanel = lazy(() => import("@/components/editor/export-panel").then(module => ({ default: module.ExportPanel })));

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
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    useEditorStore.getState().loadCodeFromStorage()
  }, [])
  
  const texts = language === 'zh' ? zhMessages : enMessages;

  // Default to English before hydration
  const inputTabText = isMounted ? texts.editor.input : enMessages.editor.input;
  const previewTabText = isMounted ? texts.editor.preview : enMessages.editor.preview;
  const loadingText = isMounted ? (language === 'zh' ? '加载中...' : 'Loading...') : 'Loading...';

  if (!isMounted) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner text="Initializing..." />
      </div>
    );
  }

  return (
    <div className="w-full h-full px-3 pb-3 mermaid-editor-container" suppressHydrationWarning={true}>
      {/* 移动设备上的选项卡布局 */}
      <div className="block md:hidden h-full" suppressHydrationWarning={true}>
        <Tabs defaultValue="input" className="h-full flex flex-col">
          <TabsList className="grid grid-cols-2 bg-muted p-1 rounded-md mb-2 shrink-0 w-full max-w-full mx-auto" suppressHydrationWarning={true}>
            <TabsTrigger value="input" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-sm py-1.5 text-sm font-medium min-w-0 flex-1 truncate" suppressHydrationWarning={true}>{inputTabText}</TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-sm py-1.5 text-sm font-medium min-w-0 flex-1 truncate" suppressHydrationWarning={true}>{previewTabText}</TabsTrigger>
          </TabsList>
          <div className="flex-grow overflow-hidden min-h-0">
            <TabsContent value="input" className="h-full" suppressHydrationWarning={true}>
              <Suspense fallback={<LoadingSpinner text={loadingText} />}>
                <CodeInput />
              </Suspense>
            </TabsContent>
            <TabsContent value="preview" className="h-full" suppressHydrationWarning={true}>
              <Suspense fallback={<LoadingSpinner text={loadingText} />}>
                <Preview />
              </Suspense>
            </TabsContent>
          </div>
        </Tabs>
      </div>
      
      {/* 桌面设备上的并排布局 */}
      <div className="hidden md:flex gap-3 h-full" suppressHydrationWarning={true}>
        {/* 输入区域 */}
        <div className="w-1/2 h-full relative">
          <Suspense fallback={<LoadingSpinner text={loadingText} />}>
            <CodeInput />
          </Suspense>
        </div>
        {/* 预览区域 */}
        <div className="w-1/2 h-full relative">
          <Suspense fallback={<LoadingSpinner text={loadingText} />}>
            <Preview />
          </Suspense>
        </div>
      </div>
      
      {/* 导出面板 */}
      <Suspense fallback={null}>
        <ExportPanel />
      </Suspense>
    </div>
  )
} 