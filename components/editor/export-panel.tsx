"use client"

import { useRef, useState, useEffect, useMemo, useCallback } from "react"
import type { CSSProperties } from "react"
import { useEditorStore, ExportFormat, ExportPadding, EXPORT_PADDING_VALUES } from "@/store/editor-store"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { exportSvg, exportPng, exportJpg, exportWebp, CLIP_GUARD_PADDING, BASE_OPTIMIZE_PADDING, createPngBlob, createJpgBlob, createWebpBlob } from "@/lib/utils/mermaid"
import { toast } from "react-hot-toast"
import { useLanguage } from "@/components/language-provider"
import { FileImage, FileText, ChevronRight, ChevronLeft, CopyIcon } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import enMessages from "@/messages/en.json"
import zhMessages from "@/messages/zh.json"
import { motion } from "motion/react"
import { panelRevealTransition, panelRevealVariants } from "@/config/motion"

const DEFAULT_EXPORT_PANEL_TEXTS = {
  copySvg: "Copy SVG",
  copyImage: "Copy PNG",
  includeBackground: "Include background",
  filename: "Filename",
  filenamePlaceholder: "Enter filename here",
  noPreview: "Please generate a preview first",
  selectFormat: "Select format",
  padding: "Canvas padding",
  calculating: "Calculating…",
  paddingOptions: {
    none: "None",
    small: "Small",
    medium: "Medium",
    large: "Large",
  },
  minimize: "Minimize Export Panel",
  open: "Open Export Panel",
}

const PANEL_TRANSITION_MS = 240
const MotionCard = motion(Card)
const BUTTON_REVEAL_DELAY_MS = 140

const scheduleStateUpdate = (cb: () => void) => {
  const frame = requestAnimationFrame(cb)
  return () => cancelAnimationFrame(frame)
}

export function ExportPanel() {
  const svg = useEditorStore((state) => state.svg)
  const exportFormat = useEditorStore((state) => state.exportFormat)
  const setExportFormat = useEditorStore((state) => state.setExportFormat)
  const exportScale = useEditorStore((state) => state.exportScale)
  const setExportScale = useEditorStore((state) => state.setExportScale)
  const includeBackground = useEditorStore((state) => state.includeBackground)
  const setIncludeBackground = useEditorStore((state) => state.setIncludeBackground)
  const exportPadding = useEditorStore((state) => state.exportPadding)
  const setExportPadding = useEditorStore((state) => state.setExportPadding)
  const exportFilename = useEditorStore((state) => state.exportFilename)
  const setExportFilename = useEditorStore((state) => state.setExportFilename)
  const estimatedSize = useEditorStore((state) => state.estimatedSize)
  const estimatedFileSize = useEditorStore((state) => state.estimatedFileSize)
  const isExportPanelMinimized = useEditorStore((state) => state.isExportPanelMinimized)
  const toggleExportPanelMinimized = useEditorStore((state) => state.toggleExportPanelMinimized)
  
  const previewRef = useRef<HTMLDivElement>(null)
  const { language } = useLanguage()
  const [previewKey, setPreviewKey] = useState(0) // 用于控制预览图重新渲染
  const [formatSelectOpen, setFormatSelectOpen] = useState(false)
  const [scaleSelectOpen, setScaleSelectOpen] = useState(false)
  const [paddingSelectOpen, setPaddingSelectOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const [isPanelHidden, setIsPanelHidden] = useState(isExportPanelMinimized)
  const [isButtonVisible, setIsButtonVisible] = useState(isExportPanelMinimized)
  const [viewportLimit, setViewportLimit] = useState<number | null>(null)
  const [previewHeight, setPreviewHeight] = useState<number | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  const showToast = useCallback((type: "success" | "error", title: string, description?: string) => {
    const message = description ? (
      <div className="flex flex-col gap-1">
        <span>{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
    ) : (
      title
    )

    const options = description ? { duration: 6000 } : undefined

    if (type === "success") {
      toast.success(message, options)
    } else {
      toast.error(message, options)
    }
  }, [])

  // 当SVG内容变化时，更新预览图的 key 以确保渲染状态被刷新
  useEffect(() => {
    if (!svg) {
      return
    }
    return scheduleStateUpdate(() => setPreviewKey((prev) => prev + 1))
  }, [svg])
  
  useEffect(() => {
    if (!isExportPanelMinimized) {
      return
    }
    return scheduleStateUpdate(() => {
      setFormatSelectOpen(false)
      setScaleSelectOpen(false)
      setPaddingSelectOpen(false)
    })
  }, [isExportPanelMinimized])

  useEffect(() => {
    return scheduleStateUpdate(() => setIsMounted(true))
  }, [])

  useEffect(() => {
    let panelHideTimeout: ReturnType<typeof setTimeout> | null = null
    let buttonRevealTimeout: ReturnType<typeof setTimeout> | null = null
    const cleanups: Array<() => void> = []

    cleanups.push(
      scheduleStateUpdate(() => {
        if (!isExportPanelMinimized) {
          setIsPanelHidden(false)
          setIsButtonVisible(false)
          return
        }

        setIsButtonVisible(false)
        buttonRevealTimeout = setTimeout(() => {
          cleanups.push(
            scheduleStateUpdate(() => {
              setIsButtonVisible(true)
            })
          )
        }, BUTTON_REVEAL_DELAY_MS)

        panelHideTimeout = setTimeout(() => {
          cleanups.push(
            scheduleStateUpdate(() => {
              setIsPanelHidden(true)
            })
          )
        }, PANEL_TRANSITION_MS)
      })
    )

    return () => {
      if (panelHideTimeout) {
        clearTimeout(panelHideTimeout)
      }
      if (buttonRevealTimeout) {
        clearTimeout(buttonRevealTimeout)
      }
      cleanups.forEach((cleanup) => cleanup())
    }
  }, [isExportPanelMinimized])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const RESERVE_REM = 6
    const updateViewportMetrics = () => {
      const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      const reservedSpace = RESERVE_REM * rootFontSize
      scheduleStateUpdate(() => {
        setViewportLimit(Math.max(0, window.innerHeight - reservedSpace))
      })
    }

    const frame = requestAnimationFrame(updateViewportMetrics)
    window.addEventListener("resize", updateViewportMetrics)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", updateViewportMetrics)
    }
  }, [])

  useEffect(() => {
    if (svg) {
      return
    }
    return scheduleStateUpdate(() => setPreviewHeight(null))
  }, [svg])

  useEffect(() => {
    if (!svg) {
      return
    }
    return scheduleStateUpdate(() => setPreviewHeight(null))
  }, [previewKey, svg])

  useEffect(() => {
    if (exportFormat === 'jpg' && !includeBackground) {
      return scheduleStateUpdate(() => setIncludeBackground(true))
    }
  }, [exportFormat, includeBackground, setIncludeBackground])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    const ResizeObserverRef = window.ResizeObserver
    if (!ResizeObserverRef) {
      return
    }
    if (!svg || isExportPanelMinimized) {
      return
    }

    const element = previewRef.current
    if (!element) {
      return
    }

    const observer = new ResizeObserverRef((entries) => {
      const entry = entries[0]
      if (!entry) {
        return
      }
      const { height } = entry.contentRect
      if (height > 0) {
        setPreviewHeight((prev) => {
          const roundedHeight = Math.round(height * 1000) / 1000
          if (prev !== null && Math.abs(prev - roundedHeight) < 0.5) {
            return prev
          }
          return roundedHeight
        })
      }
    })

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [svg, isExportPanelMinimized, previewKey])

  const effectiveMessages = language === 'zh' ? zhMessages : enMessages;
  const exportTexts = effectiveMessages.export;
  const exportPanelTexts = {
    ...DEFAULT_EXPORT_PANEL_TEXTS,
    ...(effectiveMessages.exportPanel ?? {}),
  };
  const notificationTexts = effectiveMessages.notifications;
  const fallbackPaddingOptions = DEFAULT_EXPORT_PANEL_TEXTS.paddingOptions as Record<ExportPadding, string>;
  const paddingOptionsSource = (exportPanelTexts.paddingOptions as Partial<Record<ExportPadding, string>> | undefined) ?? fallbackPaddingOptions;
  const paddingOptionTexts: Record<ExportPadding, string> = {
    none: paddingOptionsSource.none ?? fallbackPaddingOptions.none,
    small: paddingOptionsSource.small ?? fallbackPaddingOptions.small,
    medium: paddingOptionsSource.medium ?? fallbackPaddingOptions.medium,
    large: paddingOptionsSource.large ?? fallbackPaddingOptions.large,
  };
  
  const cardTitleText = exportTexts.title;
  const cardDescDimensionsText = exportTexts.estimatedDimensions;
  const cardDescSizeText = exportTexts.estimatedSize;
  const selectFormatPlaceholderText = exportPanelTexts.selectFormat;
  const scalePlaceholderText = exportTexts.scale;
  const isRasterFormat = exportFormat !== 'svg';
  const exportButtonTextMap: Record<ExportFormat, string | undefined> = {
    svg: exportTexts.svg,
    png: exportTexts.png,
    jpg: exportTexts.jpg ?? exportTexts.png,
    webp: exportTexts.webp ?? exportTexts.png,
  };
  const exportButtonText = exportButtonTextMap[exportFormat] ?? exportTexts.png;
  const minimizePanelText = exportPanelTexts.minimize;
  const openPanelText = exportPanelTexts.open;
  const copySvgText = exportPanelTexts.copySvg ?? DEFAULT_EXPORT_PANEL_TEXTS.copySvg;
  const copyImageText = exportPanelTexts.copyImage ?? DEFAULT_EXPORT_PANEL_TEXTS.copyImage;
  const filenameLabelText = exportPanelTexts.filename;
  const filenamePlaceholderText = exportPanelTexts.filenamePlaceholder;
  const noPreviewText = exportPanelTexts.noPreview;
  const includeBackgroundText = exportPanelTexts.includeBackground;
  const paddingLabelText = exportPanelTexts.padding ?? DEFAULT_EXPORT_PANEL_TEXTS.padding;
  const calculatingFileSizeText = exportPanelTexts.calculating ?? DEFAULT_EXPORT_PANEL_TEXTS.calculating;
  const exportSuccessText = notificationTexts.exportSuccess;
  const exportErrorText = notificationTexts.exportError;
  const copySuccessText = notificationTexts.copySuccess;
  const copyErrorText = notificationTexts.copyError;
  const copyButtonLabel = isRasterFormat ? copyImageText : copySvgText;
  const paddingPx = EXPORT_PADDING_VALUES[exportPadding];
  const extraPaddingPerSide = useMemo(() => {
    const guard = Math.ceil(CLIP_GUARD_PADDING);
    const base = paddingPx > 0 ? BASE_OPTIMIZE_PADDING : 0;
    return guard + base + paddingPx;
  }, [paddingPx]);
  const paddedEstimatedSize = useMemo(() => {
    if (!estimatedSize) return null;
    const extra = extraPaddingPerSide * 2;
    return {
      width: Math.max(0, Math.round(estimatedSize.width + extra)),
      height: Math.max(0, Math.round(estimatedSize.height + extra)),
    };
  }, [estimatedSize, extraPaddingPerSide]);
  const computedEstimatedFileSize = svg
    ? (estimatedFileSize ?? calculatingFileSizeText)
    : (estimatedFileSize ?? noPreviewText);
  const paddingSelectOptions: { value: ExportPadding; label: string }[] = [
    { value: 'none', label: paddingOptionTexts.none },
    { value: 'small', label: paddingOptionTexts.small },
    { value: 'medium', label: paddingOptionTexts.medium },
    { value: 'large', label: paddingOptionTexts.large },
  ];

  const handleExport = async () => {
    if (!svg) {
      showToast("error", exportErrorText, noPreviewText)
      return
    }
    
    const finalFilename = exportFilename.trim() || (exportFormat === 'svg' ? 'mermaid-diagram' : 'mermaid-diagram');

    try {
      if (exportFormat === 'svg') {
        await exportSvg(svg, finalFilename, paddingPx)
        showToast("success", exportSuccessText)
      } else if (exportFormat === 'png') {
        await exportPng(svg, finalFilename, exportScale, includeBackground, paddingPx);
        showToast("success", exportSuccessText);
      } else if (exportFormat === 'jpg') {
        await exportJpg(svg, finalFilename, exportScale, includeBackground, paddingPx);
        showToast("success", exportSuccessText);
      } else if (exportFormat === 'webp') {
        await exportWebp(svg, finalFilename, exportScale, includeBackground, paddingPx);
        showToast("success", exportSuccessText);
      }
    } catch (error) {
      console.error("Export error:", error)
      showToast("error", exportErrorText, error instanceof Error ? error.message : String(error))
    }
  }
  
  const imageClipboardUnsupportedText = useMemo(() => {
    if (language === 'zh') {
      return '无法复制图片到剪贴板：当前浏览器或页面环境未启用 ClipboardItem 接口，可能由于浏览器版本过低、未使用 HTTPS、或权限被拒绝所致。';
    }
    return 'Unable to copy image to clipboard: the ClipboardItem API is unavailable in this environment, often due to an unsupported browser, missing HTTPS context, or clipboard permission being denied.';
  }, [language]);

  const clipboardFormatFallbackText = useMemo(() => {
    if (language === 'zh') {
      return '浏览器不支持将该格式写入剪贴板，已自动转换为 PNG 并复制。';
    }
    return 'This browser cannot write that image format to the clipboard; copied as PNG instead.';
  }, [language]);

  const copySvgToClipboard = async (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    if (typeof document === "undefined") {
      throw new Error("Clipboard API unavailable in this environment");
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    const selection = document.getSelection();
    const originalRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    textarea.select();

    let success = false;
    try {
      success = document.execCommand("copy");
    } catch {
      success = false;
    }

    textarea.remove();

    if (originalRange) {
      selection?.removeAllRanges();
      selection?.addRange(originalRange);
    }

    if (!success) {
      throw new Error("Copy to clipboard is not supported in this environment");
    }
  };

  const rasterClipboardMimeMap: Record<Exclude<ExportFormat, 'svg'>, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    webp: 'image/webp',
  };

  const createRasterBlobForFormat = async (format: Exclude<ExportFormat, 'svg'>, svgContent: string) => {
    switch (format) {
      case 'png':
        return createPngBlob(svgContent, exportScale, includeBackground, paddingPx);
      case 'jpg':
        return createJpgBlob(svgContent, exportScale, includeBackground, paddingPx);
      case 'webp':
        return createWebpBlob(svgContent, exportScale, includeBackground, paddingPx);
      default: {
        const exhaustiveCheck: never = format;
        throw new Error(`Unsupported format: ${exhaustiveCheck}`);
      }
    }
  };

  const copyRasterToClipboard = async (format: Exclude<ExportFormat, 'svg'>, svgContent: string) => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      throw new Error(imageClipboardUnsupportedText);
    }
    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
      throw new Error(imageClipboardUnsupportedText);
    }

    const attemptedFormats: Exclude<ExportFormat, 'svg'>[] =
      format === 'png' ? ['png'] : [format, 'png'];
    let lastError: unknown = null;

    for (const targetFormat of attemptedFormats) {
      try {
        const blob = await createRasterBlobForFormat(targetFormat, svgContent);
        const mimeType = rasterClipboardMimeMap[targetFormat];
        await navigator.clipboard.write([new ClipboardItem({ [mimeType]: blob })]);
        return targetFormat !== format;
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError instanceof Error) {
      throw lastError;
    }
    throw new Error(imageClipboardUnsupportedText);
  };

  const handleCopy = async () => {
    if (!svg) {
      showToast("error", copyErrorText, noPreviewText);
      return;
    }
    try {
      let fallbackUsed = false;
      if (exportFormat === 'svg') {
        await copySvgToClipboard(svg);
      } else {
        fallbackUsed = await copyRasterToClipboard(exportFormat, svg);
      }

      if (fallbackUsed) {
        showToast("success", copySuccessText, clipboardFormatFallbackText);
      } else {
        showToast("success", copySuccessText);
      }
    } catch (err) {
      console.error("Failed to copy content to clipboard:", err);
      showToast("error", copyErrorText, err instanceof Error ? err.message : String(err));
    }
  };
  
  const formatOptions = [
    { value: 'svg', label: 'SVG', Icon: FileText },
    { value: 'png', label: 'PNG', Icon: FileImage },
    { value: 'jpg', label: 'JPG', Icon: FileImage },
    { value: 'webp', label: 'WebP', Icon: FileImage },
  ] as const;
  
  const scaleOptions = [
    { value: 1, label: '1x' },
    { value: 1.5, label: '1.5x' },
    { value: 2, label: '2x' },
    { value: 3, label: '3x' },
  ];
  const selectedFormatOption = formatOptions.find((option) => option.value === exportFormat);

  const resolvedViewportLimit = viewportLimit != null ? `${viewportLimit}px` : null

  const panelWrapperStyle: CSSProperties = {
    maxHeight: resolvedViewportLimit ?? 'calc(100vh - 6rem)',
    pointerEvents: isExportPanelMinimized ? "none" : "auto",
    overflow: "visible",
    visibility: isPanelHidden ? "hidden" : "visible",
    transformOrigin: "left bottom",
  }

  if (!isMounted) {
    return null;
  }

  const minimizedButton = (
    <Button 
      variant="outline" 
      onClick={toggleExportPanelMinimized}
      aria-label={openPanelText}
      className="bg-[#171717]/95 text-white hover:bg-[#0f0f0f] hover:text-white border-[#2a2a2a] dark:bg-white dark:text-[#111111] dark:hover:bg-white/90 dark:hover:text-[#111111] dark:border-[#d9d9d9] rounded-full shadow-lg px-5 py-2.5 inline-flex items-center gap-2 whitespace-nowrap text-sm"
    >
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-current" />
      <span className="text-sm font-medium">
        {cardTitleText || "Export"}
      </span>
    </Button>
  )

  const expandedPanel = (
    <motion.div
      aria-hidden={isExportPanelMinimized}
      hidden={isPanelHidden}
      translate="no"
      style={{
        ...panelWrapperStyle,
        originX: 0,
        originY: 1,
      }}
      className="notranslate will-change-[transform,opacity] origin-bottom-left"
      initial={false}
      variants={panelRevealVariants}
      animate={isExportPanelMinimized ? "collapsed" : "expanded"}
      transition={panelRevealTransition}
    >
      <MotionCard
        ref={panelRef}
        initial={false}
        className={`w-full max-h-[calc(100vh-6rem)] bg-card border-border/60 shadow-[0_18px_48px_rgba(12,12,12,0.22)] backdrop-blur-md supports-[backdrop-filter]:bg-card/98 flex flex-col rounded-2xl p-3 origin-bottom-left ${
          isExportPanelMinimized ? "pointer-events-none" : "pointer-events-auto"
        }`}
        style={{
          maxHeight: resolvedViewportLimit ?? undefined,
          overflow: "hidden",
          willChange: "transform, opacity",
          transformOrigin: "left bottom",
        }}
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
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </CardHeader>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 p-1">
          {isMounted && paddedEstimatedSize && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs mb-2 px-1 pt-1">
                <div className="text-left">
                  <span className="text-muted-foreground">{cardDescDimensionsText}</span>
                  <span className="block text-foreground font-medium">{paddedEstimatedSize.width}x{paddedEstimatedSize.height}px</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">{cardDescSizeText}</span>
                  <span className="block text-foreground font-medium">{computedEstimatedFileSize}</span>
                </div>
              </div>

              <div 
                ref={previewRef}
                style={{
                  minHeight: previewHeight != null ? `${previewHeight}px` : undefined,
                }}
                className="w-full aspect-video bg-muted/30 rounded-md overflow-hidden border border-border/50 mb-3 relative flex items-center justify-center max-h-full"
              >
                {svg ? (
                  <div
                    key={`preview-${previewKey}`}
                    dangerouslySetInnerHTML={{ __html: svg }} 
                    className="w-full h-full object-contain p-4 [&>svg]:w-[calc(100%-16px)] [&>svg]:h-[calc(100%-16px)] [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:object-contain [&>svg]:m-auto" 
                  />
                ) : (
                  <p className="text-xs text-muted-foreground/70 italic">
                    {noPreviewText}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3 pb-1">
            <div className="grid items-end gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
              <div className={`min-w-[7rem] ${isRasterFormat ? "" : "md:col-span-2"}`}>
                <label htmlFor="exportFormat" className="text-[0.77rem] text-muted-foreground px-1 block mb-1">
                  {selectFormatPlaceholderText}
                </label>
                <Select 
                  value={exportFormat} 
                  onValueChange={(value) => setExportFormat(value as ExportFormat)}
                  open={formatSelectOpen}
                  onOpenChange={setFormatSelectOpen}
                >
                  <SelectTrigger id="exportFormat" className="w-full h-9 text-[0.77rem]">
                    <SelectValue
                      placeholder={selectFormatPlaceholderText}
                      aria-label={selectedFormatOption?.label ?? selectFormatPlaceholderText}
                    >
                      {selectedFormatOption ? (
                        <span className="flex items-center gap-2">
                          <selectedFormatOption.Icon className="w-4 h-4" aria-hidden="true" />
                          <span>{selectedFormatOption.label}</span>
                        </span>
                      ) : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {formatOptions.map(option => (
                      <SelectItem key={option.value} value={option.value} className="text-[0.77rem]">
                        <div className="flex items-center gap-2">
                          <option.Icon className="w-4 h-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isRasterFormat ? (
                <div className="min-w-[2rem] md:w-[6.5rem] md:min-w-[6.5rem]">
                  <label htmlFor="exportScale" className="text-[0.77rem] text-muted-foreground px-1 block mb-1">
                    {scalePlaceholderText}
                  </label>
                  <Select 
                    value={String(exportScale)} 
                    onValueChange={(value) => setExportScale(Number(value))}
                    open={scaleSelectOpen}
                    onOpenChange={setScaleSelectOpen}
                  >
                    <SelectTrigger id="exportScale" className="w-full h-9 text-[0.77rem] md:w-full"> 
                      <SelectValue placeholder={scalePlaceholderText} />
                    </SelectTrigger>
                    <SelectContent>
                      {scaleOptions.map(option => (
                        <SelectItem key={option.value} value={String(option.value)} className="text-[0.77rem]">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="min-w-[7rem] max-w-[10rem]">
                <label htmlFor="exportPadding" className="text-[0.77rem] text-muted-foreground px-1 block mb-1">{paddingLabelText}</label>
                <Select 
                  value={exportPadding} 
                  onValueChange={(value) => setExportPadding(value as ExportPadding)}
                  open={paddingSelectOpen}
                  onOpenChange={setPaddingSelectOpen}
                >
                  <SelectTrigger id="exportPadding" className="w-full h-9 text-[0.77rem]">
                    <SelectValue placeholder={paddingLabelText} />
                  </SelectTrigger>
                  <SelectContent>
                    {paddingSelectOptions.map(option => (
                      <SelectItem key={option.value} value={option.value} className="text-[0.77rem]">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isRasterFormat && exportFormat !== 'jpg' && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeBackground" 
                  checked={includeBackground} 
                  onCheckedChange={(checked) => setIncludeBackground(Boolean(checked))}
                  className="w-4 h-4 shadow-xs rounded-sm border-input data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <label
                  htmlFor="includeBackground"
                  className="text-[0.77rem] font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {includeBackgroundText}
                </label>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2">
              <label htmlFor="filename" className="text-[0.77rem] text-muted-foreground px-1">{filenameLabelText}</label>
              <Input 
                id="filename"
                type="text" 
                value={exportFilename}
                onChange={(e) => setExportFilename(e.target.value)}
                placeholder={filenamePlaceholderText}
                className="h-9 shadow-xs text-[0.77rem]"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <Button 
                onClick={handleCopy} 
                variant="outline" 
                size="icon" 
                className="h-9 w-auto px-3"
                aria-label={copyButtonLabel}
                title={copyButtonLabel}
                disabled={!svg}
              >
                <CopyIcon className="h-4 w-4" />
              </Button>
              <Button 
                onClick={handleExport} 
                className="flex-grow h-9 text-[0.77rem]"
                disabled={!svg}
              >
                {exportButtonText}
              </Button>
            </div>
          </div>
        </div>
      </MotionCard>
    </motion.div>
  );

  return (
    <div className="fixed bottom-8 left-8 z-40 notranslate" translate="no">
      <div className={`relative flex flex-col justify-end ${isPanelHidden ? "w-auto" : "w-full max-w-[24rem]"}`}>
        <div
          translate="no"
          className={`absolute bottom-0 left-0 transition-opacity duration-150 ease-out ${
            isButtonVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          style={{ zIndex: 1 }}
        >
          {minimizedButton}
        </div>
        {expandedPanel}
      </div>
    </div>
  );
}
