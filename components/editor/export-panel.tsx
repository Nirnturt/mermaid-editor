"use client"

import { useRef, useState, useEffect } from "react"
import { useEditorStore, ExportFormat } from "@/store/editor-store"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { exportSvg, exportPng } from "@/lib/utils/mermaid"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { useLanguage } from "@/components/language-provider"
import { FileImage, FileText, ChevronRight, ChevronLeft, CopyIcon } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

export function ExportPanel() {
  const { 
    svg, 
    exportFormat, 
    setExportFormat,
    exportScale,
    setExportScale,
    includeBackground,
    setIncludeBackground,
    exportFilename,
    setExportFilename,
    estimatedSize,
    estimatedFileSize,
    isExportPanelMinimized,
    toggleExportPanelMinimized
  } = useEditorStore()
  
  const previewRef = useRef<HTMLDivElement>(null)
  const { language } = useLanguage()
  const [isMounted, setIsMounted] = useState(false)
  const [previewKey, setPreviewKey] = useState(0) // 用于控制预览图重新渲染

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 当SVG内容变化时，更新预览图的key以触发重新动画
  useEffect(() => {
    if (svg) {
      setPreviewKey(prev => prev + 1)
    }
  }, [svg])
  
  const i18nTexts = {
    en: {
      title: 'Export',
      svg: 'Export as SVG',
      png: 'Export as PNG',
      scale: 'Scale',
      copySVG: 'Copy SVG',
      copySVGSuccess: 'SVG copied to clipboard',
      copySVGError: 'Failed to copy SVG',
      includeBackground: 'Include background',
      filename: 'Filename',
      filenamePlaceholder: 'Enter filename here',
      estimatedSize: 'Estimated Size',
      estimatedDimensions: 'Estimated Dimensions',
      exportSuccess: 'Exported successfully',
      exportError: 'Failed to export',
      noPreview: 'Please generate a preview first',
      selectFormat: 'Select format',
      minimizeExport: 'Minimize Export Panel',
      openExport: 'Open Export'
    },
    zh: {
      title: '导出',
      svg: '导出为 SVG',
      png: '导出为 PNG',
      scale: '缩放比例',
      copySVG: '复制SVG代码',
      copySVGSuccess: 'SVG已复制到剪贴板',
      copySVGError: '复制SVG失败',
      includeBackground: '包含背景',
      filename: '文件名',
      filenamePlaceholder: '在此输入文件名',
      estimatedSize: '预计大小',
      estimatedDimensions: '预计尺寸',
      exportSuccess: '导出成功',
      exportError: '导出失败',
      noPreview: '请先生成预览',
      selectFormat: '选择格式',
      minimizeExport: '最小化导出面板',
      openExport: '打开导出面板'
    }
  }

  const texts = isMounted ? i18nTexts[language] : i18nTexts.en;
  
  const cardTitleText = isMounted ? texts.title : "";
  const cardDescDimensionsText = isMounted ? texts.estimatedDimensions : "";
  const cardDescSizeText = isMounted ? texts.estimatedSize : "";
  const selectFormatPlaceholderText = isMounted ? texts.selectFormat : "";
  const scalePlaceholderText = isMounted ? texts.scale : "";
  const exportButtonText = isMounted ? (texts[exportFormat] || texts.svg) : "Export";
  const minimizePanelText = isMounted ? texts.minimizeExport : "Minimize";
  const openPanelText = isMounted ? texts.openExport : "Open Export";
  const copySVGText = isMounted ? texts.copySVG : "Copy SVG";
  const filenameLabelText = isMounted ? texts.filename : "Filename";
  const filenamePlaceholderText = isMounted ? texts.filenamePlaceholder : "Enter filename here";
  
  const handleExport = async () => {
    if (!svg) {
      toast.error(texts.exportError, {
        description: texts.noPreview
      })
      return
    }
    
    const finalFilename = exportFilename.trim() || (exportFormat === 'svg' ? 'mermaid-diagram' : 'mermaid-diagram');

    try {
      if (exportFormat === 'svg') {
        await exportSvg(svg, finalFilename)
        toast.success(texts.exportSuccess)
      } else if (exportFormat === 'png') {
        const container = document.createElement('div');
        container.innerHTML = svg;
        const svgElement = container.firstChild as HTMLElement;
        
        if (!svgElement) {
          throw new Error('Could not create SVG element');
        }
        
        if (estimatedSize) {
          const width = estimatedSize.width * exportScale;
          const height = estimatedSize.height * exportScale;
          svgElement.setAttribute('width', String(width));
          svgElement.setAttribute('height', String(height));
        }
        
        document.body.appendChild(container);
        await exportPng(svgElement, finalFilename, exportScale, includeBackground);
        document.body.removeChild(container);
        
        toast.success(texts.exportSuccess);
      } 
    } catch (error) {
      console.error("Export error:", error)
      toast.error(texts.exportError, {
        description: error instanceof Error ? error.message : String(error)
      })
    }
  }
  
  const handleCopySVG = async () => {
    if (!svg) {
      toast.error(texts.copySVGError, {
        description: texts.noPreview
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(svg);
      toast.success(texts.copySVGSuccess);
    } catch (err) {
      console.error("Failed to copy SVG to clipboard:", err);
      toast.error(texts.copySVGError, {
        description: err instanceof Error ? err.message : String(err)
      });
    }
  };
  
  const formatOptions: { value: ExportFormat; label: string; icon: React.ReactNode }[] = [
    { value: 'svg', label: 'SVG', icon: <FileText className="w-4 h-4 mr-2" /> },
    { value: 'png', label: 'PNG', icon: <FileImage className="w-4 h-4 mr-2" /> },
  ]
  
  const scaleOptions = [
    { value: 1, label: '1x' },
    { value: 1.5, label: '1.5x' },
    { value: 2, label: '2x' },
    { value: 3, label: '3x' },
  ]

  // 简化的动画配置
  const panelTransition = {
    type: "spring",
    stiffness: 200,
    damping: 25,
    mass: 0.5
  }

  const contentTransition = {
    type: "spring",
    stiffness: 250,
    damping: 25,
    mass: 0.5,
    staggerChildren: 0.05,
    delayChildren: 0.1
  }

  if (!isMounted) {
    return null;
  }

  return (
    <div className="fixed bottom-8 left-8 z-40">
      <motion.div
        initial={false}
        animate={{
          width: isExportPanelMinimized ? "auto" : "100%",
          maxWidth: isExportPanelMinimized ? "auto" : "24rem"
        }}
        transition={panelTransition}
        className="origin-left"
      >
        <motion.div
          animate={{
            scale: isExportPanelMinimized ? 0.95 : 1,
            opacity: 1
          }}
          transition={contentTransition}
        >
          {isExportPanelMinimized ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={toggleExportPanelMinimized}
              aria-label={openPanelText}
              className="bg-background/90 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground rounded-full shadow-lg border-border/60 px-3 inline-flex items-center gap-2 h-9 whitespace-nowrap transition-colors duration-200"
            >
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
              <motion.span 
                className="text-xs font-medium"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                {cardTitleText || "Export"}
              </motion.span>
            </Button>
          ) : (
            <Card className="w-full bg-card/95 border-border/60 shadow-xl backdrop-blur-md supports-[backdrop-filter]:bg-card/80 flex flex-col overflow-hidden p-3">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="space-y-3"
              >
                <CardHeader className="flex flex-row items-center justify-between p-0 pb-2">
                  <CardTitle className="text-sm text-foreground font-medium">
                    {cardTitleText || "Export"}
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleExportPanelMinimized}
                    aria-label={minimizePanelText}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </CardHeader>

                {/* Preview Section */}
                {isMounted && estimatedSize && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-2"
                  >
                    <div className="flex justify-between text-xs mb-2 px-1 pt-1">
                      <div className="text-left">
                        <span className="text-muted-foreground">{cardDescDimensionsText}</span>
                        <span className="block text-foreground font-medium">{estimatedSize.width}x{estimatedSize.height}px</span>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground">{cardDescSizeText}</span>
                        <span className="block text-foreground font-medium">{estimatedFileSize}</span>
                      </div>
                    </div>

                    <div 
                      ref={previewRef}
                      className="w-full aspect-video bg-muted/30 rounded-md overflow-hidden border border-border/50 mb-3 relative flex items-center justify-center"
                    >
                      {svg ? (
                        <motion.div 
                          key={`preview-${previewKey}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          dangerouslySetInnerHTML={{ __html: svg }} 
                          className="w-full h-full object-contain p-4 [&>svg]:w-[calc(100%-16px)] [&>svg]:h-[calc(100%-16px)] [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:object-contain [&>svg]:m-auto" 
                        />
                      ) : (
                        <p className="text-xs text-muted-foreground/70 italic">
                          {texts.noPreview}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Controls Section */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-3"
                >
                  {/* Format and Scale Controls */}
                  <div className="flex items-center gap-3">
                    <div className={exportFormat === 'svg' ? 'flex-grow' : 'flex-1'}>
                      <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
                        <SelectTrigger className="w-full h-9 text-xs transition-all duration-200">
                          <SelectValue placeholder={selectFormatPlaceholderText} />
                        </SelectTrigger>
                        <SelectContent>
                          {formatOptions.map(option => (
                            <SelectItem key={option.value} value={option.value} className="text-xs">
                              <div className="flex items-center">
                                {option.icon}
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {exportFormat === 'png' && (
                      <div className="flex-shrink-0">
                        <Select value={String(exportScale)} onValueChange={(value) => setExportScale(Number(value))}>
                          <SelectTrigger className="w-auto h-9 text-xs transition-all duration-200"> 
                            <SelectValue placeholder={scalePlaceholderText} />
                          </SelectTrigger>
                          <SelectContent>
                            {scaleOptions.map(option => (
                              <SelectItem key={option.value} value={String(option.value)} className="text-xs">
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Background Checkbox */}
                  {exportFormat === 'png' && (
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="includeBackground" 
                        checked={includeBackground} 
                        onCheckedChange={(checked) => setIncludeBackground(Boolean(checked))}
                        className="w-3.5 h-3.5 transition-all duration-200"
                      />
                      <label
                        htmlFor="includeBackground"
                        className="text-xs font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {texts.includeBackground}
                      </label>
                    </div>
                  )}

                  {/* Filename Input */}
                  <div className="grid grid-cols-1 gap-2">
                    <label htmlFor="filename" className="text-xs text-muted-foreground px-1">{filenameLabelText}</label>
                    <Input 
                      id="filename"
                      type="text" 
                      value={exportFilename}
                      onChange={(e) => setExportFilename(e.target.value)}
                      placeholder={filenamePlaceholderText}
                      className="h-9 text-xs transition-all duration-200"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 pt-1">
                    <Button 
                      onClick={handleCopySVG} 
                      variant="outline" 
                      size="icon" 
                      className="h-9 w-auto px-2.5 transition-all duration-200 hover:scale-105"
                      aria-label={copySVGText}
                      disabled={!svg}
                    >
                      <CopyIcon className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      onClick={handleExport} 
                      className="flex-grow h-9 text-xs transition-all duration-200 hover:scale-105"
                      disabled={!svg}
                    >
                      {exportButtonText}
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            </Card>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
} 