"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { useEditorStore } from "@/store/editor-store"
import { renderMermaid, getSvgSize, estimateFileSize } from "@/lib/utils/mermaid"
import { motion } from "framer-motion"
import { Loader2, AlertTriangleIcon, ZoomInIcon, ZoomOutIcon, LocateFixedIcon } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import enMessages from "@/messages/en.json";
import zhMessages from "@/messages/zh.json";
import { toast } from "sonner"

const MIN_SCALE = 0.1
const MAX_SCALE = 5
const ZOOM_SENSITIVITY = 0.001

// 合并相关的视图状态
interface ViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
  isPanning: boolean;
}

export function Preview() {
  const { 
    code, 
    svg, 
    setSvg, 
    isRendering, 
    setIsRendering, 
    error,
    setError,
    exportFormat,
    exportScale: storeExportScale,
    setEstimatedSize,
    setEstimatedFileSize,
    estimatedSize: svgBBoxSizeFromStore, // Renamed for clarity, this is BBox size
  } = useEditorStore()
  
  const previewWrapperRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const { language } = useLanguage()
  const { theme: appTheme } = useTheme()
  const [isMounted, setIsMounted] = useState(false)
  const prevAppThemeRef = useRef(appTheme)

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

  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // 缓存语言相关的文本
  const texts = useMemo(() => language === 'zh' ? zhMessages : enMessages, [language]);
  const placeholderText = useMemo(() => 
    language === 'zh' ? "预览将在这里显示" : "Preview will be shown here", [language]
  );
  const displayPlaceholder = isMounted ? placeholderText : "";

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
      isPanning: false
    });
    setContentRefUnscaledHeight(null);
  }, [setViewState, setContentRefUnscaledHeight]);

  useEffect(() => {
    if (!code.trim() || error) {
      resetViewState();
    }
  }, [code, error, resetViewState])

  useEffect(() => {
    const renderDiagram = async () => {
      if (!code.trim()) { 
        setSvg(null); setError(null); setEstimatedSize(null); setEstimatedFileSize(null);
        resetViewState();
        return;
      }
      setIsRendering(true);

      try {
        const renderedSvg = await renderMermaid(code);
        setSvg(renderedSvg);
        setError(null);
        const bboxSize = getSvgSize(renderedSvg); 
        setEstimatedSize(bboxSize); 
        const estimatedSizeStr = estimateFileSize(renderedSvg, exportFormat, storeExportScale);
        setEstimatedFileSize(estimatedSizeStr);

        let adjustedHeight = bboxSize.height; 
        let viewBoxString: string | null = null;

        if (renderedSvg) {
          const tempDiv = document.createElement('div');
          tempDiv.style.position = 'absolute';
          tempDiv.style.visibility = 'hidden';
          tempDiv.innerHTML = renderedSvg;
          document.body.appendChild(tempDiv);
          const svgElem = tempDiv.querySelector('svg');
          if (svgElem) {
            viewBoxString = svgElem.getAttribute('viewBox');
          }
          document.body.removeChild(tempDiv);
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
        setContentRefUnscaledHeight(adjustedHeight);
        
        if (previewWrapperRef.current && bboxSize.width > 0 && adjustedHeight > 0) {
          const container = previewWrapperRef.current;
          const containerWidth = container.clientWidth;
          const containerHeight = container.clientHeight;
          
          const scaleX = containerWidth / bboxSize.width;
          const scaleY = containerHeight / adjustedHeight; 
          const initialScale = Math.min(scaleX, scaleY);
          
          let initialOffsetX = (containerWidth - bboxSize.width * initialScale) / 2;
          let initialOffsetY = 0; 

          if (isNaN(initialOffsetX) || !isFinite(initialOffsetX)) initialOffsetX = 0;
          if (isNaN(initialOffsetY) || !isFinite(initialOffsetY)) initialOffsetY = 0;
          
          setViewState({
            scale: initialScale,
            offsetX: initialOffsetX,
            offsetY: initialOffsetY,
            isPanning: false
          });
        } else {
          resetViewState();
        }

      } catch (err) {
        console.error("[Preview] Render Diagram Error:", err);
        let userFriendlyError = texts.mermaidErrors.defaultError;
        const errorMessage = err instanceof Error ? err.message : String(err);

        if (errorMessage.toLowerCase().includes("no diagram type detected")) {
          userFriendlyError = texts.mermaidErrors.noTypeDetected;
        } else if (errorMessage.toLowerCase().includes("lexical error") || 
                   errorMessage.toLowerCase().includes("parse error") || 
                   errorMessage.toLowerCase().includes("syntax error")) {
          userFriendlyError = texts.mermaidErrors.syntaxError;
        } else if (errorMessage.toLowerCase().includes("cannot read properties of undefined") || 
                   errorMessage.toLowerCase().includes("failed to parse")) { 
          userFriendlyError = texts.mermaidErrors.parseError;
        }
        
        setError(userFriendlyError);
        setSvg(null); 
        setEstimatedSize(null);
        setEstimatedFileSize(null);
        setContentRefUnscaledHeight(null);
        resetViewState();
        toast.dismiss("mermaid-render-success");
        toast.error(texts.editor.previewErrorPrompt, {
          description: errorMessage,
          duration: 5000,
        });
      } finally {
        setIsRendering(false);
      }
    };

    let debounceDelay = 500;
    if (appTheme !== prevAppThemeRef.current) {
      debounceDelay = 30;
      prevAppThemeRef.current = appTheme;
    }
    const debounceTimer = setTimeout(renderDiagram, debounceDelay);
    return () => clearTimeout(debounceTimer);
  }, [code, appTheme, exportFormat, storeExportScale, setSvg, setError, setIsRendering, setEstimatedSize, setEstimatedFileSize, texts, resetViewState]);
  
  useEffect(() => {
    if (svg && svgBBoxSizeFromStore) { // Use svgBBoxSizeFromStore here
      const estimatedSizeStr = estimateFileSize(svg, exportFormat, storeExportScale)
      setEstimatedFileSize(estimatedSizeStr)
    }
  }, [exportFormat, storeExportScale, svg, svgBBoxSizeFromStore, setEstimatedFileSize])

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
    const newScale = Math.min(scaleX, scaleY);

    let newOffsetX = (containerWidth - currentBBoxSize.width * newScale) / 2;
    let newOffsetY = 0; 

    if (isNaN(newOffsetX) || !isFinite(newOffsetX)) newOffsetX = 0;
    if (isNaN(newOffsetY) || !isFinite(newOffsetY)) newOffsetY = 0;

    setViewState({
      scale: newScale,
      offsetX: newOffsetX,
      offsetY: newOffsetY,
      isPanning: false
    });
  }, [contentRefUnscaledHeight, resetViewState]);

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
      initial={isMounted ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      suppressHydrationWarning={true}
      style={{
        backgroundColor: "hsla(var(--background-hsl), 0.8)",
      }}
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
        suppressHydrationWarning={true}
      >
        <div
          dangerouslySetInnerHTML={{ __html: svg || '' }}
          suppressHydrationWarning={true}
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
          suppressHydrationWarning={true}
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