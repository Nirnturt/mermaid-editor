"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { useEditorStore, EXPORT_PADDING_VALUES } from "@/store/editor-store"
import { renderMermaid, getSvgSize, estimateFileSize, isGanttDiagramCode, MermaidRenderError } from "@/lib/utils/mermaid"
import { motion } from "motion/react"
import { transitions, variants } from "@/config/motion"
import { Loader2, AlertTriangleIcon, ZoomInIcon, ZoomOutIcon, LocateFixedIcon } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import enMessages from "@/messages/en.json";
import zhMessages from "@/messages/zh.json";

const MIN_SCALE = 0.1
const MAX_SCALE = 5
const ZOOM_SENSITIVITY = 0.001
const GANTT_LEFT_MARGIN = 16
const GANTT_HEIGHT_OVERFLOW_ALLOWANCE = 1.3

// 合并相关的视图状态
interface ViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
  isPanning: boolean;
}

export function Preview() {
  const code = useEditorStore((state) => state.code)
  const svg = useEditorStore((state) => state.svg)
  const bindFunctions = useEditorStore((state) => state.bindFunctions)
  const isRendering = useEditorStore((state) => state.isRendering)
  const setIsRendering = useEditorStore((state) => state.setIsRendering)
  const error = useEditorStore((state) => state.error)
  const setError = useEditorStore((state) => state.setError)
  const exportFormat = useEditorStore((state) => state.exportFormat)
  const exportScale = useEditorStore((state) => state.exportScale)
  const includeBackground = useEditorStore((state) => state.includeBackground)
  const exportPadding = useEditorStore((state) => state.exportPadding)
  const svgBBoxSizeFromStore = useEditorStore((state) => state.estimatedSize)
  const setRenderResult = useEditorStore((state) => state.setRenderResult)
  const setEstimatedSize = useEditorStore((state) => state.setEstimatedSize)
  const setEstimatedFileSize = useEditorStore((state) => state.setEstimatedFileSize)
  
  const previewWrapperRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const { language } = useLanguage()
  const { theme: themePreference, resolvedTheme } = useTheme()
  const prevThemeSignatureRef = useRef(`${themePreference}-${resolvedTheme}`)
  const prevCodeRef = useRef(code)
  const prevLanguageRef = useRef(language)
  const prevDiagramMetricsRef = useRef<{ width: number; height: number } | null>(null)
  const hasRenderedDiagramRef = useRef(false)

  // Pan and Zoom state
  const [viewState, setViewState] = useState<ViewState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isPanning: false
  });
  const animationFrameRef = useRef<number | null>(null);
  const dragStartMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // State to hold the calculated unscaled height for contentRef, adjusted for viewBox aspect ratio
  const [contentRefUnscaledHeight, setContentRefUnscaledHeight] = useState<number | null>(null);

  const computeGanttViewState = useCallback(
    (
      containerWidth: number,
      containerHeight: number,
      diagramWidth: number,
      diagramHeight: number
    ) => {
      if (
        containerWidth <= 0 ||
        containerHeight <= 0 ||
        diagramWidth <= 0 ||
        diagramHeight <= 0
      ) {
        return { scale: 1, offsetX: 0 };
      }

      const widthScale = containerWidth / diagramWidth;
      const heightScale = containerHeight / diagramHeight;

      let scale = 1;

      if (Number.isFinite(heightScale) && heightScale > 0 && heightScale < 1) {
        scale = Math.max(MIN_SCALE, Math.min(heightScale, MAX_SCALE));
      }

      if (Number.isFinite(widthScale) && widthScale > 1) {
        const widthDrivenScale = Math.min(widthScale, MAX_SCALE);
        scale = Math.max(scale, 1);

        if (Number.isFinite(heightScale) && heightScale > 0) {
          const heightAllowance =
            (containerHeight * GANTT_HEIGHT_OVERFLOW_ALLOWANCE) / diagramHeight;
          const maxAllowedScale =
            heightAllowance > 0
              ? Math.min(Math.max(heightAllowance, 1), MAX_SCALE)
              : MAX_SCALE;
          scale = Math.min(widthDrivenScale, maxAllowedScale);
        } else {
          scale = widthDrivenScale;
        }
      }

      scale = Math.max(MIN_SCALE, Math.min(scale, MAX_SCALE));

      const scaledWidth = diagramWidth * scale;
      const offsetX =
        scaledWidth >= containerWidth
          ? GANTT_LEFT_MARGIN
          : (containerWidth - scaledWidth) / 2;

      return {
        scale,
        offsetX: Number.isFinite(offsetX) ? offsetX : 0,
      };
    },
    []
  );

  useEffect(() => {
    if (!svg || !bindFunctions || !svgContainerRef.current) {
      return;
    }
    try {
      bindFunctions(svgContainerRef.current);
    } catch (error) {
      console.error('[Preview] bindFunctions execution failed:', error);
    }
  }, [svg, bindFunctions]);
  
  // 缓存语言相关的文本
  const texts = useMemo(() => language === 'zh' ? zhMessages : enMessages, [language]);
  const calculatingText = useMemo(
    () => texts.exportPanel?.calculating ?? (language === "zh" ? "计算中…" : "Calculating…"),
    [texts, language]
  );
  const placeholderText = useMemo(() => 
    language === 'zh' ? "预览将在这里显示" : "Preview will be shown here", [language]
  );
  const displayPlaceholder = placeholderText;
  const paddingPx = useMemo(() => EXPORT_PADDING_VALUES[exportPadding], [exportPadding]);
  const isGanttDiagram = useMemo(() => isGanttDiagramCode(code), [code]);

  // 缓存变换样式
  const transformStyle = useMemo(() => ({
    width: svgBBoxSizeFromStore?.width ? `${svgBBoxSizeFromStore.width}px` : 'auto',
    height: contentRefUnscaledHeight ? `${contentRefUnscaledHeight}px` : (svgBBoxSizeFromStore?.height ? `${svgBBoxSizeFromStore.height}px` : 'auto'),
    transform: `translate(${viewState.offsetX}px, ${viewState.offsetY}px) scale(${viewState.scale})`,
    transformOrigin: '0 0', 
    cursor: viewState.isPanning ? 'grabbing' : (svg ? 'grab' : 'default'),
    touchAction: 'none',
    transition: 'opacity 0.3s',
    opacity: isRendering ? 0.2 : 1,
  }), [svgBBoxSizeFromStore, contentRefUnscaledHeight, viewState, svg, isRendering]);

  const resetViewState = useCallback(() => {
    setViewState({
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      isPanning: false,
    });
    setContentRefUnscaledHeight(null);
    prevDiagramMetricsRef.current = null;
    hasRenderedDiagramRef.current = false;
  }, [setViewState, setContentRefUnscaledHeight]);

  useEffect(() => {
    if (!code.trim() || error) {
      resetViewState();
    }
  }, [code, error, resetViewState])

  useEffect(() => {
    const previousCode = prevCodeRef.current;
    const previousThemeSignature = prevThemeSignatureRef.current;
    const themeSignature = `${themePreference}-${resolvedTheme}`;
    const didCodeChange = code !== previousCode;
    const didThemeChange = themeSignature !== previousThemeSignature;
    const shouldRecenterView = !hasRenderedDiagramRef.current || didCodeChange;

    let debounceDelay = 500;
    if (didThemeChange) {
      debounceDelay = 30;
    }

    let isCancelled = false;

    const renderDiagram = async () => {
      if (!code.trim()) {
        if (isCancelled) return;
        setRenderResult({ svg: null });
        setError(null);
        setEstimatedSize(null);
        setEstimatedFileSize(null);
        resetViewState();
        return;
      }

      if (isCancelled) return;
      setIsRendering(true);
      setEstimatedFileSize(calculatingText);

      try {
        const { svg: renderedSvg, bindFunctions: svgBind } = await renderMermaid(code);
        if (isCancelled) return;

        setRenderResult({ svg: renderedSvg, bindFunctions: svgBind });
        setError(null);

        const bboxSize = getSvgSize(renderedSvg, { includeSafetyMargin: false });
        if (isCancelled) return;

        setEstimatedSize(bboxSize);

        let adjustedHeight = bboxSize.height;
        let viewBoxString: string | null = null;

        if (renderedSvg) {
          const tempDiv = document.createElement("div");
          tempDiv.style.position = "absolute";
          tempDiv.style.visibility = "hidden";
          tempDiv.innerHTML = renderedSvg;
          document.body.appendChild(tempDiv);
          const svgElem = tempDiv.querySelector("svg");
          if (svgElem) {
            viewBoxString = svgElem.getAttribute("viewBox");
          }
          tempDiv.remove();
        }

        if (viewBoxString && bboxSize.width > 0) {
          const parts = viewBoxString.split(/[\s,]+/).map(parseFloat);
          if (parts.length === 4) {
            const viewBoxWidth = parts[2];
            const viewBoxHeight = parts[3];
            if (viewBoxWidth > 0 && viewBoxHeight > 0) {
              adjustedHeight = bboxSize.width * (viewBoxHeight / viewBoxWidth);
            }
          }
        }

        if (isCancelled) return;
        setContentRefUnscaledHeight(adjustedHeight);

        if (previewWrapperRef.current && bboxSize.width > 0 && adjustedHeight > 0) {
          const container = previewWrapperRef.current;
          const containerWidth = container.clientWidth;
          const containerHeight = container.clientHeight;

          if (containerWidth > 0 && containerHeight > 0) {
            if (shouldRecenterView) {
              const scaleX = containerWidth / bboxSize.width;
              const scaleY = containerHeight / adjustedHeight;

              let initialScale: number;
              let initialOffsetX: number;

              if (isGanttDiagram) {
                const { scale: ganttScale, offsetX: ganttOffsetX } = computeGanttViewState(
                  containerWidth,
                  containerHeight,
                  bboxSize.width,
                  adjustedHeight
                );
                initialScale = ganttScale;
                initialOffsetX = ganttOffsetX;
              } else {
                const fitScale = Math.min(scaleX, scaleY);
                initialScale = Math.max(MIN_SCALE, Math.min(fitScale, MAX_SCALE));
                initialOffsetX = (containerWidth - bboxSize.width * initialScale) / 2;
              }

              if (!Number.isFinite(initialOffsetX)) {
                initialOffsetX = 0;
              }

              setViewState({
                scale: initialScale,
                offsetX: initialOffsetX,
                offsetY: 0,
                isPanning: false,
              });
            } else {
              setViewState((prev) => {
                const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale));
                const safeOffsetX = Number.isFinite(prev.offsetX) ? prev.offsetX : 0;
                const safeOffsetY = Number.isFinite(prev.offsetY) ? prev.offsetY : 0;

                return {
                  ...prev,
                  scale: clampedScale,
                  offsetX: safeOffsetX,
                  offsetY: safeOffsetY,
                  isPanning: false,
                };
              });
            }
          } else if (shouldRecenterView) {
            resetViewState();
          }
        } else if (shouldRecenterView) {
          resetViewState();
        }

        if (!isCancelled) {
          hasRenderedDiagramRef.current = true;
          prevDiagramMetricsRef.current = {
            width: bboxSize.width,
            height: adjustedHeight,
          };
        }
      } catch (err) {
        console.error("[Preview] Render Diagram Error:", err);
        if (isCancelled) return;

        let userFriendlyError = texts.mermaidErrors.defaultError;

        if (err instanceof MermaidRenderError) {
          const codeMap: Record<MermaidRenderError["code"], string> = {
            NO_TYPE: texts.mermaidErrors.noTypeDetected,
            SYNTAX: texts.mermaidErrors.syntaxError,
            PARSE: texts.mermaidErrors.parseError,
            REFERENCE: texts.mermaidErrors.parseError,
            DUPLICATE: texts.mermaidErrors.parseError,
            UNKNOWN: texts.mermaidErrors.defaultError,
          };
          userFriendlyError = codeMap[err.code] ?? texts.mermaidErrors.defaultError;
        } else {
          const errorMessage = err instanceof Error ? err.message : String(err);
          const normalized = errorMessage.toLowerCase();
          if (normalized.includes("no diagram type detected")) {
            userFriendlyError = texts.mermaidErrors.noTypeDetected;
          } else if (
            normalized.includes("lexical error") ||
            normalized.includes("parse error") ||
            normalized.includes("syntax error")
          ) {
            userFriendlyError = texts.mermaidErrors.syntaxError;
          } else if (
            normalized.includes("cannot read properties of undefined") ||
            normalized.includes("failed to parse")
          ) {
            userFriendlyError = texts.mermaidErrors.parseError;
          }
        }

        setError(userFriendlyError);
        setRenderResult({ svg: null });
        setEstimatedSize(null);
        setEstimatedFileSize(null);
        setContentRefUnscaledHeight(null);
        resetViewState();
      } finally {
        setIsRendering(false);
      }
    };

    const debounceTimer = setTimeout(renderDiagram, debounceDelay);

    prevCodeRef.current = code;
    prevLanguageRef.current = language;
    prevThemeSignatureRef.current = themeSignature;

    return () => {
      isCancelled = true;
      clearTimeout(debounceTimer);
    };
  }, [
    code,
    themePreference,
    resolvedTheme,
    language,
    setRenderResult,
    setError,
    setIsRendering,
    setEstimatedSize,
    setEstimatedFileSize,
    texts,
    resetViewState,
    calculatingText,
    isGanttDiagram,
    computeGanttViewState,
  ]);
  
  useEffect(() => {
    if (!svg || !svgBBoxSizeFromStore) {
      setEstimatedFileSize(null);
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();

    setEstimatedFileSize(calculatingText);

    (async () => {
      try {
        const result = await estimateFileSize(
          svg,
          exportFormat,
          exportScale,
          svgBBoxSizeFromStore,
          {
            includeBackground,
            padding: paddingPx,
            signal: controller.signal,
          }
        );
        if (!isCancelled) {
          setEstimatedFileSize(result.formatted);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        if (!isCancelled) {
          setEstimatedFileSize("Unknown");
        }
      }
    })();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [
    svg,
    svgBBoxSizeFromStore,
    exportFormat,
    exportScale,
    includeBackground,
    paddingPx,
    setEstimatedFileSize,
    calculatingText,
  ]);

  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    if (!previewWrapperRef.current) return;

    const currentScale = viewState.scale;
    const currentOffsetX = viewState.offsetX;
    const currentOffsetY = viewState.offsetY;

    const rect = previewWrapperRef.current.getBoundingClientRect();
    const mouseX_viewport = event.clientX - rect.left;
    const mouseY_viewport = event.clientY - rect.top;

    const contentPointX = (mouseX_viewport - currentOffsetX) / currentScale;
    const contentPointY = (mouseY_viewport - currentOffsetY) / currentScale;

    const delta = event.deltaY * ZOOM_SENSITIVITY * currentScale;
    const newProposedScale = currentScale - delta;
    const newClampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newProposedScale));

    const newOffsetX = mouseX_viewport - contentPointX * newClampedScale;
    const newOffsetY = mouseY_viewport - contentPointY * newClampedScale;

    setViewState({
      scale: newClampedScale,
      offsetX: newOffsetX,
      offsetY: newOffsetY,
      isPanning: false
    });
  }, [viewState, setViewState]);

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault()
    setViewState({
      ...viewState,
      isPanning: true
    });
    dragStartMousePositionRef.current = { x: event.clientX, y: event.clientY };
    initialOffsetRef.current = { x: viewState.offsetX, y: viewState.offsetY }; 
    
    if (contentRef.current) {
      contentRef.current.style.cursor = 'grabbing'
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [viewState, setViewState]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!viewState.isPanning) return;
    event.preventDefault();

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const totalDx = event.clientX - dragStartMousePositionRef.current.x;
      const totalDy = event.clientY - dragStartMousePositionRef.current.y;
      
      const newOffsetX = initialOffsetRef.current.x + totalDx;
      const newOffsetY = initialOffsetRef.current.y + totalDy;
      
      setViewState({
        ...viewState,
        offsetX: newOffsetX,
        offsetY: newOffsetY
      });
      animationFrameRef.current = null; 
    });

  }, [viewState, setViewState]); 

  const handleMouseUp = useCallback(() => {
    setViewState({
      ...viewState,
      isPanning: false
    });
    if (contentRef.current) {
      contentRef.current.style.cursor = 'grab'
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [viewState]);

  const handleZoom = useCallback((zoomIn: boolean) => {
    if (!previewWrapperRef.current) return;

    const currentScale = viewState.scale;
    const currentOffsetX = viewState.offsetX;
    const currentOffsetY = viewState.offsetY;

    const container = previewWrapperRef.current;
    const containerCenterX = container.clientWidth / 2;
    const containerCenterY = container.clientHeight / 2;

    const contentPointX = (containerCenterX - currentOffsetX) / currentScale;
    const contentPointY = (containerCenterY - currentOffsetY) / currentScale;
    
    const newScaleFactor = zoomIn ? 1.2 : 1 / 1.2;
    const newUnclampedScale = currentScale * newScaleFactor;
    const newClampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newUnclampedScale));

    const newOffsetX = containerCenterX - contentPointX * newClampedScale;
    const newOffsetY = containerCenterY - contentPointY * newClampedScale;

    setViewState({
      ...viewState,
      scale: newClampedScale,
      offsetX: newOffsetX,
      offsetY: newOffsetY
    });
  }, [viewState, setViewState]); 

  const handleResetView = useCallback(() => {
    const currentBBoxSize = useEditorStore.getState().estimatedSize; 
    
    const unscaledHeightForReset = contentRefUnscaledHeight ?? currentBBoxSize?.height ?? 0;

    if (!previewWrapperRef.current || !currentBBoxSize || currentBBoxSize.width === 0 || unscaledHeightForReset === 0) {
      resetViewState();
      return;
    }

    const container = previewWrapperRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const scaleX = containerWidth / currentBBoxSize.width;
    const scaleY = containerHeight / unscaledHeightForReset; 

    let newScale: number;
    let newOffsetX: number;

    if (isGanttDiagram) {
      const { scale: ganttScale, offsetX: ganttOffsetX } = computeGanttViewState(
        containerWidth,
        containerHeight,
        currentBBoxSize.width,
        unscaledHeightForReset
      );
      newScale = ganttScale;
      newOffsetX = ganttOffsetX;
    } else {
      const fitScale = Math.min(scaleX, scaleY);
      newScale = Math.max(MIN_SCALE, Math.min(fitScale, MAX_SCALE));
      newOffsetX = (containerWidth - currentBBoxSize.width * newScale) / 2;
    }

    if (!Number.isFinite(newOffsetX)) newOffsetX = 0;

    setViewState({
      scale: newScale,
      offsetX: newOffsetX,
      offsetY: 0,
      isPanning: false
    });
  }, [contentRefUnscaledHeight, resetViewState, isGanttDiagram, computeGanttViewState]);

  useEffect(() => {
    const wrapper = previewWrapperRef.current
    if (wrapper) {
      wrapper.addEventListener('wheel', handleWheel, { passive: false })
    }

    if (viewState.isPanning) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      if (wrapper) {
        wrapper.removeEventListener('wheel', handleWheel)
      }
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, [handleWheel, viewState.isPanning, handleMouseMove, handleMouseUp])

  return (
    <motion.div
      ref={previewWrapperRef}
      className="w-full h-full bg-background border border-border shadow-xs rounded-md p-0 overflow-hidden"
      initial={variants.fadeInUp.initial}
      animate={variants.fadeInUp.animate}
      transition={{ ...transitions.linger, delay: 0.1 }}
    >
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}
      
      <div
        ref={contentRef}
        style={transformStyle}
        onMouseDown={svg && !isRendering ? handleMouseDown : undefined}
      >
        <div
          ref={svgContainerRef}
          dangerouslySetInnerHTML={{ __html: svg || '' }}
          style={{ 
            width: "100%", 
            height: "100%",
            display: "block", 
            padding: "10px",
          }}
        />
      </div>
      
      {!svg && !isRendering && !error && (
        <div 
          className="absolute inset-0 flex items-center justify-center text-muted-foreground text-center p-4 z-10 pointer-events-none"
        >
          {displayPlaceholder}
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-4 bg-background/80 z-10 pointer-events-none">
          <div className="pointer-events-auto bg-muted/20 p-6 rounded-lg max-w-md shadow-sm border border-border/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 mb-4">
              <div className="bg-muted/30 p-2 rounded-full">
                <AlertTriangleIcon className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-medium text-center text-foreground/90">
                {language === 'zh' ? zhMessages.editor.previewErrorPrompt : enMessages.editor.previewErrorPrompt}
              </h3>
              <p className="text-sm text-center text-muted-foreground">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="absolute bottom-5 right-8 z-10 flex items-center gap-1">
        <Button variant="outline" size="icon" onClick={() => handleZoom(true)} className="h-9 w-9 bg-background/80 hover:bg-accent hover:text-accent-foreground backdrop-blur-sm shadow-lg rounded-full border-border/60" title={language === 'zh' ? "放大" : "Zoom In"}>
          <ZoomInIcon className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => handleZoom(false)} className="h-9 w-9 bg-background/80 hover:bg-accent hover:text-accent-foreground backdrop-blur-sm shadow-lg rounded-full border-border/60" title={language === 'zh' ? "缩小" : "Zoom Out"}>
          <ZoomOutIcon className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleResetView} className="h-9 w-9 bg-background/80 hover:bg-accent hover:text-accent-foreground backdrop-blur-sm shadow-lg rounded-full border-border/60" title={language === 'zh' ? "重置" : "Reset Zoom"}>
          <LocateFixedIcon className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
} 
