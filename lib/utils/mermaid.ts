"use client"

import mermaid from 'mermaid';
import { saveAs } from 'file-saver';
import { Size } from '@/store/editor-store';
import { lightTheme, darkTheme } from '@/config/mermaid-themes';

const isDev = process.env.NODE_ENV !== 'production';

const devLog = (...args: unknown[]) => {
  if (isDev) {
    console.log(...args);
  }
};

const devWarn = (...args: unknown[]) => {
  if (isDev) {
    console.warn(...args);
  }
};

export type RasterImageFormat = 'png' | 'jpg' | 'webp';

const RASTER_MIME_TYPES: Record<RasterImageFormat, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
};

const RASTER_EXPORT_QUALITY: Record<RasterImageFormat, number> = {
  png: 1,
  jpg: 0.92,
  webp: 0.92,
};

export type MermaidRenderErrorCode = 'NO_TYPE' | 'SYNTAX' | 'PARSE' | 'REFERENCE' | 'DUPLICATE' | 'UNKNOWN';

export class MermaidRenderError extends Error {
  readonly code: MermaidRenderErrorCode;

  constructor(code: MermaidRenderErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'MermaidRenderError';
    this.code = code;
  }
}

export function isGanttDiagramCode(code: string): boolean {
  const lines = code.split(/\r?\n/);
  let inFrontMatter = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("%%")) continue;

    if (trimmed === "---") {
      inFrontMatter = !inFrontMatter;
      continue;
    }

    if (inFrontMatter) {
      continue;
    }

    return trimmed.toLowerCase().startsWith("gantt");
  }

  return false;
}

interface GanttMetrics {
  totalDays: number;
  taskCount: number;
}

function computeGanttMetrics(code: string): GanttMetrics {
  const dateRegex = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
  const durationRegex = /(\d+)\s*(d|day|days|w|week|weeks)/i;
  const lines = code.split(/\r?\n/);
  let earliest: Date | null = null;
  let latest: Date | null = null;
  let inferredLatest: Date | null = null;
  let priorReference: Date | null = null;
  let taskCount = 0;
  let inFrontMatter = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('%%')) continue;
    if (line === '---') {
      inFrontMatter = !inFrontMatter;
      continue;
    }
    if (inFrontMatter) continue;
    if (/^\s*gantt/i.test(line)) continue;
    if (/^\s*title/i.test(line)) continue;
    if (/^\s*dateformat/i.test(line)) continue;
    if (/^\s*section/i.test(line)) continue;

    const matches = Array.from(line.matchAll(dateRegex));
    if (matches.length > 0) {
      const dates = matches.map((match) => {
        const [year, month, day] = match.slice(1).map(Number);
        return new Date(year, month - 1, day);
      });

      if (dates.length >= 1) {
        const start = dates[0];
        if (!earliest || start < earliest) earliest = start;
        if (!latest || start > latest) latest = start;
        priorReference = start;
      }
      if (dates.length >= 2) {
        const end = dates[dates.length - 1];
        if (!latest || end > latest) latest = end;
        priorReference = end;
      }
      inferredLatest = latest ?? inferredLatest;
    } else if (priorReference) {
      const durationMatch = line.match(durationRegex);
      if (durationMatch) {
        const value = Number(durationMatch[1]);
        const unit = durationMatch[2]?.toLowerCase() ?? 'd';
        const multiplier = unit.startsWith('w') ? 7 : 1;
        const inferred = new Date(priorReference);
        inferred.setDate(inferred.getDate() + value * multiplier);
        if (!inferredLatest || inferred > inferredLatest) {
          inferredLatest = inferred;
        }
      }
    }

    if (/:/.test(line)) {
      taskCount += 1;
    }
  }

  const spanStart = earliest ?? inferredLatest ?? new Date();
  const spanEnd = latest ?? inferredLatest ?? spanStart;
  const diffMs = spanEnd.getTime() - spanStart.getTime();
  const rawDays = Number.isFinite(diffMs) && diffMs > 0
    ? Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    : GANTT_MIN_DAY_RANGE;

  return {
    totalDays: Math.max(GANTT_MIN_DAY_RANGE, rawDays),
    taskCount: Math.max(1, taskCount),
  };
}

export const BASE_OPTIMIZE_PADDING = 4;
export const CLIP_GUARD_PADDING = 1;
const SIZE_ESTIMATION_PADDING = 20;

const GANTT_MIN_DAY_RANGE = 7;
const GANTT_DAY_PIXEL_DEFAULT = 48;
const GANTT_MAX_WIDTH = 6400;
const GANTT_MIN_WIDTH = 960;

type FileSizeEstimationStrategy = "exact" | "heuristic";

export interface FileSizeEstimate {
  bytes: number | null;
  formatted: string;
  strategy: FileSizeEstimationStrategy;
}

const FILE_SIZE_CACHE = new Map<string, FileSizeEstimate>();
const FILE_SIZE_CACHE_LIMIT = 32;

function rememberFileSizeInCache(key: string, value: FileSizeEstimate) {
  if (FILE_SIZE_CACHE.size >= FILE_SIZE_CACHE_LIMIT) {
    const firstKey = FILE_SIZE_CACHE.keys().next().value;
    if (firstKey) {
      FILE_SIZE_CACHE.delete(firstKey);
    }
  }
  FILE_SIZE_CACHE.set(key, value);
}

function quickHash(input: string): string {
  const length = input.length;
  if (length === 0) return "0";

  let hash = 0;
  const sampleStep = Math.max(1, Math.floor(length / 32));
  for (let i = 0; i < length; i += sampleStep) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  hash ^= length;
  return hash.toString(16);
}

export function formatBytes(bytes: number | null): string {
  if (bytes === null || !Number.isFinite(bytes)) {
    return "Unknown";
  }
  if (bytes < 1024) {
    return `${Math.round(bytes)} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ensureNotAborted(signal?: AbortSignal) {
  if (!signal) return;
  if ("throwIfAborted" in signal) {
    try {
      (signal as AbortSignal & { throwIfAborted(): void }).throwIfAborted();
    } catch (error) {
      throw error;
    }
    return;
  }
  if ((signal as AbortSignal).aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
}

function computeHeuristicBytes(
  svgString: string,
  format: string,
  scale: number,
  size: Size
): number {
  const scaledWidth = Math.max(1, size.width * scale);
  const scaledHeight = Math.max(1, size.height * scale);
  const pixelCount = scaledWidth * scaledHeight;

  if (format === "svg") {
    return new Blob([svgString]).size;
  }

  if (format === "png") {
    const baseDensity =
      size.width > 0 && size.height > 0
        ? svgString.length / (size.width * size.height)
        : 0;
    let bytesPerPixelPostCompression = 0.1;
    if (baseDensity > 10) {
      bytesPerPixelPostCompression = 0.25;
    } else if (baseDensity > 2) {
      bytesPerPixelPostCompression = 0.15;
    }
    return pixelCount * bytesPerPixelPostCompression;
  }

  if (format === "jpg" || format === "webp") {
    const baseDensity =
      size.width > 0 && size.height > 0
        ? svgString.length / (size.width * size.height)
        : 0;
    let bytesPerPixelPostCompression =
      format === "jpg" ? 0.08 : 0.06;
    if (baseDensity > 10) {
      bytesPerPixelPostCompression = format === "jpg" ? 0.18 : 0.12;
    } else if (baseDensity > 2) {
      bytesPerPixelPostCompression = format === "jpg" ? 0.12 : 0.09;
    }
    return pixelCount * bytesPerPixelPostCompression;
  }

  return pixelCount * 0.1;
}

// Function to get current theme
function getSystemTheme() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getCurrentAppTheme() {
  if (typeof document === 'undefined') return 'light'; // Default to light for SSR or non-browser
  const htmlClass = document.documentElement.classList;
  if (htmlClass.contains('dark')) return 'dark';
  if (htmlClass.contains('light')) return 'light';
  // If neither dark nor light class is set directly on html, use system theme
  return getSystemTheme();
}

let themeObserverInstance: MutationObserver | null = null;
declare global {
  interface Window {
    __mermaidThemeObserver?: MutationObserver;
  }
}

// Initialize Mermaid with theme support
function initializeMermaidWithCurrentTheme() {
  const currentTheme = getCurrentAppTheme();
  const isDark = currentTheme === 'dark';
  const themeVariables = isDark ? darkTheme : lightTheme;
  const mindmapRootStroke =
    themeVariables.mindmapRootBorderColor ?? 'transparent';
  const mindmapRootStrokeWidth =
    themeVariables.mindmapRootBorderWidth ?? '0px';
  const mindmapRootTextColor =
    themeVariables.mindmapRootTextColor ?? (isDark ? '#f5f5f5' : '#ffffff');
  const mindmapRootBackgroundColor =
    themeVariables.mindmapRootBackgroundColor ?? (isDark ? '#2a2a2a' : '#1f1f1f');
  const mindmapRootTextFill =
    themeVariables.mindmapRootTextFill ?? mindmapRootTextColor;

  // Mermaid 初始化日志仅在开发环境输出
  devLog('[MermaidJS] Initializing with theme:', currentTheme);
  mermaid.initialize({
    startOnLoad: false, // We manually render
    theme: 'base', // Use 'base' to apply themeVariables correctly
    themeVariables,
    themeCSS: `
      .section-root rect,
      .section-root path,
      .section-root circle,
      .section-root polygon {
        stroke: ${mindmapRootStroke};
        stroke-width: ${mindmapRootStrokeWidth};
        fill: ${mindmapRootBackgroundColor};
      }
      .section-root text,
      .section-root tspan {
        fill: ${mindmapRootTextFill};
      }
      .section-root foreignObject *,
      .section-root foreignObject {
        color: ${mindmapRootTextFill};
      }
    `,
    // Harden config against XSS by following Mermaid security guidance
    securityLevel: 'antiscript',
    secure: ['secure', 'securityLevel', 'startOnLoad', 'maxTextSize'],
    suppressErrorRendering: true,
    fontFamily: 'sans-serif', // Consistent font
    gantt: {
      useMaxWidth: false,
      titleTopMargin: 28,
      barHeight: 28,
      barGap: 10,
      topPadding: 48,
      leftPadding: 96,
      rightPadding: 64,
      gridLineStartPadding: 20,
      sectionFontSize: 18,
      fontSize: 14,
      numberSectionStyles: 3,
    },
  });
}

// Initialize on client side and set up observer
if (typeof window !== 'undefined') {
  initializeMermaidWithCurrentTheme(); // Initial call

  const existingObserver = window.__mermaidThemeObserver;
  existingObserver?.disconnect();

  if (document.documentElement) {
    themeObserverInstance = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          initializeMermaidWithCurrentTheme();
          // The Preview component will also need to react to theme changes to force a re-render of the SVG
          break; 
        }
      }
    });
    
    themeObserverInstance.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });

    window.__mermaidThemeObserver = themeObserverInstance;

    window.addEventListener('beforeunload', () => {
      window.__mermaidThemeObserver?.disconnect();
      window.__mermaidThemeObserver = undefined;
    }, { once: true });
  }
}

function injectDirectiveForGantt(code: string): string {
  if (!isGanttDiagramCode(code)) {
    return code;
  }

  const metrics = computeGanttMetrics(code);
  const estimatedWidth = Math.max(
    GANTT_MIN_WIDTH,
    Math.min(GANTT_MAX_WIDTH, metrics.totalDays * GANTT_DAY_PIXEL_DEFAULT)
  );

  let tickInterval: string | undefined;
  if (metrics.totalDays <= 31) {
    tickInterval = '1day';
  } else if (metrics.totalDays <= 180) {
    tickInterval = '1week';
  } else {
    tickInterval = '1month';
  }

  const directiveConfig: Record<string, unknown> = {
    gantt: {
      useMaxWidth: false,
      useWidth: estimatedWidth,
      ...(tickInterval ? { tickInterval } : {}),
    },
  };

  const directive = `%%{init: ${JSON.stringify(directiveConfig)}}%%`;

  if (code.startsWith('---')) {
    const endIndex = code.indexOf('\n---', 3);
    if (endIndex !== -1) {
      const frontmatterEnd = endIndex + 4;
      return `${code.slice(0, frontmatterEnd)}\n${directive}\n${code.slice(frontmatterEnd)}`;
    }
  }

  return `${directive}\n${code}`;
}

export interface MermaidRenderOutput {
  svg: string;
  bindFunctions?: (element: Element) => void;
}

function normalizeMermaidError(error: unknown): MermaidRenderError {
  if (error instanceof MermaidRenderError) {
    return error;
  }

  const rawMessage =
    error instanceof Error ? error.message : String(error ?? 'Unknown error');
  const normalized = rawMessage.toLowerCase();

  if (
    normalized.includes('no diagram type detected') ||
    normalized.includes('unknown diagram type')
  ) {
    return new MermaidRenderError('NO_TYPE', rawMessage);
  }
  if (
    normalized.includes('lexical error') ||
    normalized.includes('parse error') ||
    normalized.includes('syntax error')
  ) {
    return new MermaidRenderError('SYNTAX', rawMessage);
  }
  if (
    normalized.includes('cannot read properties of undefined') ||
    normalized.includes('failed to parse') ||
    normalized.includes('parseerror')
  ) {
    return new MermaidRenderError('PARSE', rawMessage);
  }
  if (normalized.includes('not defined') || normalized.includes('undefined')) {
    return new MermaidRenderError('REFERENCE', rawMessage);
  }
  if (normalized.includes('already') && normalized.includes('defined')) {
    return new MermaidRenderError('DUPLICATE', rawMessage);
  }

  return new MermaidRenderError('UNKNOWN', rawMessage);
}

// 渲染Mermaid图表为SVG字符串 - 使用官方推荐的渲染方式
export async function renderMermaid(code: string): Promise<MermaidRenderOutput> {
  const enrichedCode = injectDirectiveForGantt(code);

  const container = document.createElement('div');
  container.style.visibility = 'hidden';
  container.style.position = 'absolute';
  document.body.appendChild(container);

  try {
    const { svg, bindFunctions } = await mermaid.render(
      'mermaid-diagram-' + Date.now(),
      enrichedCode,
      container
    );
    return { svg, bindFunctions: bindFunctions ?? undefined };
  } catch (mermaidError: unknown) {
    if (isDev) {
      console.error('Mermaid render error:', mermaidError);
    }
    throw normalizeMermaidError(mermaidError);
  } finally {
    container.remove();
  }
}

// 优化SVG以提高兼容性并防止边缘裁剪
export function optimizeSvg(svgString: string, additionalPadding: number = 0): string {
  try {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgElement = svgDoc.querySelector('svg');
    
    if (!svgElement) {
      devWarn('No SVG element found in string');
      return svgString;
    }

    // 获取精确的尺寸和边界框信息
    const baseSize = getSvgSize(svgString, { includeSafetyMargin: false });
    devLog('SVG optimization - calculated size:', baseSize);

    // 创建临时元素来获取精确的边界框
    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.visibility = 'hidden';
    temp.style.pointerEvents = 'none';
    temp.style.top = '-9999px';
    temp.style.left = '-9999px';
    temp.innerHTML = svgString;
    document.body.appendChild(temp);

    const tempSvgElement = temp.querySelector('svg') as SVGSVGElement | null;
    let bbox: DOMRect | null = null;
    
    if (tempSvgElement) {
      tempSvgElement.style.display = 'block';
      tempSvgElement.style.maxWidth = 'none';
      tempSvgElement.style.maxHeight = 'none';
      
      try {
        const svgBBox = tempSvgElement.getBBox();
        if (svgBBox && svgBBox.width > 0 && svgBBox.height > 0) {
          bbox = svgBBox;
          devLog('SVG optimization - getBBox result:', bbox);
        }
      } catch (e) {
        devWarn('getBBox failed in SVG optimization:', e);
      }
    }
    
    temp.remove();

    // 计算安全边距和最终viewBox
    const requestedPadding = Math.max(0, additionalPadding);
    const basePadding = requestedPadding === 0 ? 0 : BASE_OPTIMIZE_PADDING;
    const effectivePadding = basePadding + requestedPadding;
    const totalPadding = effectivePadding + CLIP_GUARD_PADDING;
    const widthAttr = parseFloat(svgElement.getAttribute('width') ?? '');
    const heightAttr = parseFloat(svgElement.getAttribute('height') ?? '');
    const baselineWidth = Number.isFinite(widthAttr) && widthAttr > 0 ? widthAttr : baseSize.width;
    const baselineHeight = Number.isFinite(heightAttr) && heightAttr > 0 ? heightAttr : baseSize.height;

    let contentMinX: number;
    let contentMinY: number;
    let contentMaxX: number;
    let contentMaxY: number;

    if (bbox) {
      contentMinX = bbox.x;
      contentMinY = bbox.y;
      contentMaxX = bbox.x + bbox.width;
      contentMaxY = bbox.y + bbox.height;
    } else {
      contentMinX = 0;
      contentMinY = 0;
      contentMaxX = Math.max(1, baselineWidth);
      contentMaxY = Math.max(1, baselineHeight);
    }

    const finalMinX = Math.floor(contentMinX - totalPadding);
    const finalMinY = Math.floor(contentMinY - totalPadding);
    const finalMaxX = Math.ceil(contentMaxX + totalPadding);
    const finalMaxY = Math.ceil(contentMaxY + totalPadding);

    const finalWidth = Math.max(1, finalMaxX - finalMinX);
    const finalHeight = Math.max(1, finalMaxY - finalMinY);
    const finalViewBox = `${finalMinX} ${finalMinY} ${finalWidth} ${finalHeight}`;
    
    svgElement.setAttribute('width', String(finalWidth));
    svgElement.setAttribute('height', String(finalHeight));
    
    // 设置优化后的viewBox
    svgElement.setAttribute('viewBox', finalViewBox);
    devLog('SVG optimization - final viewBox:', finalViewBox);
    
    // 确保必要的属性
    if (!svgElement.hasAttribute('xmlns')) {
      svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }
    
    if (!svgElement.hasAttribute('preserveAspectRatio')) {
      svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    }

    // 重新序列化优化后的SVG
    let optimizedSvgString = new XMLSerializer().serializeToString(svgElement);
    
    // 添加XML和DOCTYPE声明
    if (!optimizedSvgString.startsWith('<?xml')) {
      optimizedSvgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + 
                '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' + 
                optimizedSvgString;
    }
    
    // 嵌入样式以提高兼容性
    if (!optimizedSvgString.includes('<style') && optimizedSvgString.includes('<svg')) {
      const styleTag = '<style type="text/css"><![CDATA[\n' +
        '  @font-face {\n' +
        '    font-family: "sans-serif";\n' +
        '    font-weight: normal;\n' +
        '    font-style: normal;\n' +
        '  }\n' +
        '  text { font-family: sans-serif; }\n' +
        ']]></style>';
      
      optimizedSvgString = optimizedSvgString.replace(/<svg([^>]*)>/, `<svg$1>${styleTag}`);
    }
    
    devLog('SVG optimization complete');
    return optimizedSvgString;
    
  } catch (error) {
    if (isDev) {
      console.error('SVG optimization error:', error);
    }
    // 如果优化失败，至少尝试添加基本的兼容性改进
    let fallbackSvg = svgString;
    
    // 添加XML声明
    if (!fallbackSvg.startsWith('<?xml')) {
      fallbackSvg = '<?xml version="1.0" encoding="UTF-8"?>\n' + fallbackSvg;
    }
    
    return fallbackSvg;
  }
}

// 获取SVG尺寸 - 更精确的尺寸计算，防止边缘裁剪
export function getSvgSize(svgString: string, options?: { includeSafetyMargin?: boolean }): Size {
  const includeSafetyMargin = options?.includeSafetyMargin ?? true;
  const marginAdjustment = includeSafetyMargin ? SIZE_ESTIMATION_PADDING : 0;

  try {
    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.visibility = 'hidden';
    temp.style.pointerEvents = 'none';
    temp.style.top = '-9999px';
    temp.style.left = '-9999px';
    temp.innerHTML = svgString;
    document.body.appendChild(temp);

    let finalWidth = 0;
    let finalHeight = 0;

    try {
      const svgElement = temp.querySelector('svg') as SVGSVGElement | null;

      if (svgElement) {
        svgElement.style.display = 'block';
        svgElement.style.maxWidth = 'none';
        svgElement.style.maxHeight = 'none';

        try {
          const bbox = svgElement.getBBox();
          if (bbox && bbox.width > 1 && bbox.height > 1) {
            const rightEdge = bbox.x + bbox.width;
            const bottomEdge = bbox.y + bbox.height;
            const leftEdge = Math.min(0, bbox.x);
            const topEdge = Math.min(0, bbox.y);

            finalWidth = Math.max(rightEdge - leftEdge, bbox.width);
            finalHeight = Math.max(bottomEdge - topEdge, bbox.height);

            devLog('Using getBBox method:', { bbox, finalWidth, finalHeight });
          }
        } catch (e) {
          devWarn('getBBox failed:', e);
        }

        if (finalWidth <= 1 || finalHeight <= 1) {
          try {
            const rect = svgElement.getBoundingClientRect();
            if (rect.width > 1 && rect.height > 1) {
              finalWidth = rect.width;
              finalHeight = rect.height;
              devLog('Using getBoundingClientRect method:', { rect, finalWidth, finalHeight });
            }
          } catch (e) {
            devWarn('getBoundingClientRect failed:', e);
          }
        }

        if (finalWidth <= 1 || finalHeight <= 1) {
          const widthAttr = svgElement.getAttribute('width');
          const heightAttr = svgElement.getAttribute('height');
          if (widthAttr && heightAttr) {
            const parsedWidth = parseFloat(widthAttr);
            const parsedHeight = parseFloat(heightAttr);
            if (parsedWidth > 1 && parsedHeight > 1) {
              finalWidth = parsedWidth;
              finalHeight = parsedHeight;
              devLog('Using width/height attributes:', { finalWidth, finalHeight });
            }
          }
        }

        if (finalWidth <= 1 || finalHeight <= 1) {
          const viewBox = svgElement.getAttribute('viewBox');
          if (viewBox) {
            const parts = viewBox.split(/[\s,]+/).map(parseFloat);
            if (parts.length === 4 && parts[2] > 1 && parts[3] > 1) {
              finalWidth = parts[2];
              finalHeight = parts[3];
              devLog('Using viewBox method:', { viewBox, finalWidth, finalHeight });
            }
          }
        }
      }
    } finally {
      temp.remove();
    }

    if (finalWidth > 1 && finalHeight > 1) {
      return {
        width: Math.ceil(finalWidth) + marginAdjustment,
        height: Math.ceil(finalHeight) + marginAdjustment,
      };
    }

    const widthMatch = svgString.match(/width=["']([\d.]+)["']/);
    const heightMatch = svgString.match(/height=["']([\d.]+)["']/);
    if (widthMatch && heightMatch) {
      const width = parseFloat(widthMatch[1]);
      const height = parseFloat(heightMatch[1]);
      if (width > 1 && height > 1) {
        return {
          width: Math.ceil(width) + marginAdjustment,
          height: Math.ceil(height) + marginAdjustment,
        };
      }
    }

    devWarn('Unable to determine SVG size, using default values');
    return {
      width: 800 + marginAdjustment,
      height: 600 + marginAdjustment,
    };
  } catch (error) {
    if (isDev) {
      console.error('Critical error in getSvgSize:', error);
    }
    return {
      width: 800 + marginAdjustment,
      height: 600 + marginAdjustment,
    };
  }
}

// 估算文件大小（优先计算精确结果，必要时回退启发式）
export async function estimateFileSize(
  svgString: string,
  format: string,
  scale: number = 1,
  precomputedSize?: Size | null,
  options: {
    includeBackground?: boolean;
    padding?: number;
    signal?: AbortSignal;
  } = {}
): Promise<FileSizeEstimate> {
  let fallbackResult: FileSizeEstimate = {
    bytes: null,
    formatted: "Unknown",
    strategy: "heuristic",
  };

  try {
    ensureNotAborted(options.signal);
    if (!svgString) {
      return fallbackResult;
    }

    const size =
      precomputedSize ??
      getSvgSize(svgString, { includeSafetyMargin: false });
    const heuristicBytes = Math.max(
      0,
      computeHeuristicBytes(svgString, format, scale, size)
    );
    fallbackResult = {
      bytes: heuristicBytes,
      formatted: formatBytes(heuristicBytes),
      strategy: "heuristic",
    };

    const padding = options.padding ?? 0;
    const includeBackground =
      options.includeBackground !== undefined ? options.includeBackground : true;
    const cacheKey = [
      "v2",
      format,
      scale.toFixed(3),
      includeBackground ? "bg1" : "bg0",
      padding,
      size.width,
      size.height,
      svgString.length,
      quickHash(svgString),
    ].join("|");

    const cached = FILE_SIZE_CACHE.get(cacheKey);
    if (cached) {
      return cached;
    }

    ensureNotAborted(options.signal);
    if (format === "svg") {
      const optimizedSvg = optimizeSvg(svgString, padding);
      ensureNotAborted(options.signal);
      const bytes = new Blob([optimizedSvg]).size;
      const result: FileSizeEstimate = {
        bytes,
        formatted: formatBytes(bytes),
        strategy: "exact",
      };
      rememberFileSizeInCache(cacheKey, result);
      return result;
    }

    if (format === "png" || format === "jpg" || format === "webp") {
      const blobCreators = {
        png: createPngBlob,
        jpg: createJpgBlob,
        webp: createWebpBlob,
      } as const;

      const createBlob = blobCreators[format as keyof typeof blobCreators];
      const blob = await createBlob(
        svgString,
        scale,
        includeBackground,
        padding
      );
      ensureNotAborted(options.signal);
      const bytes = blob.size;
      const result: FileSizeEstimate = {
        bytes,
        formatted: formatBytes(bytes),
        strategy: "exact",
      };
      rememberFileSizeInCache(cacheKey, result);
      return result;
    }

    rememberFileSizeInCache(cacheKey, fallbackResult);
    return fallbackResult;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    if (isDev) {
      console.warn("Accurate file size estimation failed:", error);
    }
    return fallbackResult;
  }
}

// 导出SVG - 改进的导出流程
export async function exportSvg(svgString: string, filename: string = 'diagram', padding: number = 0): Promise<void> {
  try {
    devLog('Starting SVG export for:', filename);
    devLog('Original SVG string length:', svgString.length);
    
    const optimizedSvg = optimizeSvg(svgString, padding);
    devLog('Optimized SVG string length:', optimizedSvg.length);
    
    const blob = new Blob([optimizedSvg], { type: 'image/svg+xml;charset=utf-8' });
    devLog('Created SVG blob, size:', blob.size);
    
    saveAs(blob, `${filename}.svg`);
    devLog('SVG export completed successfully');
  } catch (error) {
    if (isDev) {
      console.error('SVG export error:', error);
    }
    throw new Error(`Failed to export SVG: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 将SVG转为PNG的Blob，供导出或复制使用
async function createRasterBlobInternal(
  format: RasterImageFormat,
  svgString: string,
  scale: number = 1,
  includeBackground: boolean = true,
  padding: number = 0
): Promise<Blob> {
  try {
    devLog(`Starting ${format.toUpperCase()} blob creation`);
    const optimizedSvg = optimizeSvg(svgString, padding);

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(optimizedSvg, 'image/svg+xml');
    const rootSvgElement = svgDoc.querySelector('svg');

    if (!rootSvgElement) {
      throw new Error('Invalid SVG: Root SVG element not found');
    }

    const widthAttr = parseFloat(rootSvgElement.getAttribute('width') ?? '');
    const heightAttr = parseFloat(rootSvgElement.getAttribute('height') ?? '');

    let baseWidth = Number.isFinite(widthAttr) && widthAttr > 0 ? widthAttr : 0;
    let baseHeight = Number.isFinite(heightAttr) && heightAttr > 0 ? heightAttr : 0;

    if (baseWidth <= 0 || baseHeight <= 0) {
      const fallbackSize = getSvgSize(optimizedSvg, { includeSafetyMargin: false });
      baseWidth = fallbackSize.width;
      baseHeight = fallbackSize.height;
    }

    const targetWidth = Math.max(1, Math.round(baseWidth * scale));
    const targetHeight = Math.max(1, Math.round(baseHeight * scale));

    rootSvgElement.setAttribute('width', String(targetWidth));
    rootSvgElement.setAttribute('height', String(targetHeight));

    if (!rootSvgElement.hasAttribute('preserveAspectRatio')) {
      rootSvgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    }
    if (!rootSvgElement.hasAttribute('xmlns')) {
      rootSvgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }

    const processedSvgString = new XMLSerializer().serializeToString(rootSvgElement);
    devLog('Processed SVG string length:', processedSvgString.length);

    return await new Promise<Blob>((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const shouldForceOpaqueBackground = format === 'jpg';
      const effectiveIncludeBackground = includeBackground || shouldForceOpaqueBackground;

      if (effectiveIncludeBackground) {
        const isDark = document.documentElement.classList.contains('dark');
        const backgroundColor = isDark ? '#222222' : '#ffffff';
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      } else {
        ctx.clearRect(0, 0, targetWidth, targetHeight);
      }

      const img = new Image();

      img.onload = () => {
        devLog('Image loaded successfully, drawing to canvas...');
        try {
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          const mimeType = RASTER_MIME_TYPES[format];
          const quality = RASTER_EXPORT_QUALITY[format];

          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error(`Failed to create ${format.toUpperCase()} blob from canvas`));
              return;
            }
            devLog(`${format.toUpperCase()} blob created successfully, size:`, blob.size);
            resolve(blob);
          }, mimeType, quality);
        } catch (drawError) {
          if (isDev) {
            console.error(`Error drawing image to canvas for ${format.toUpperCase()} export:`, drawError);
          }
          reject(new Error('Failed to draw image to canvas'));
        }
      };

      img.onerror = (err) => {
        if (isDev) {
          console.error(`Image load error for ${format.toUpperCase()} export:`, err);
          console.error('SVG content (first 1000 chars):', processedSvgString.substring(0, 1000));
        }
        reject(new Error('Failed to load SVG image for raster conversion'));
      };

      try {
        const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(processedSvgString)}`;
        devLog('Setting rasterization image source...');
        img.src = svgDataUrl;
      } catch (encodeError) {
        if (isDev) {
          console.error('Error encoding SVG to data URL:', encodeError);
        }
        reject(new Error('Failed to encode SVG to data URL'));
      }
    });
  } catch (error) {
    if (isDev) {
      console.error(`${format.toUpperCase()} blob creation error:`, error);
    }
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export async function createPngBlob(
  svgString: string,
  scale: number = 1,
  includeBackground: boolean = true,
  padding: number = 0
): Promise<Blob> {
  return createRasterBlobInternal('png', svgString, scale, includeBackground, padding);
}

export async function createJpgBlob(
  svgString: string,
  scale: number = 1,
  includeBackground: boolean = true,
  padding: number = 0
): Promise<Blob> {
  return createRasterBlobInternal('jpg', svgString, scale, includeBackground, padding);
}

export async function createWebpBlob(
  svgString: string,
  scale: number = 1,
  includeBackground: boolean = true,
  padding: number = 0
): Promise<Blob> {
  return createRasterBlobInternal('webp', svgString, scale, includeBackground, padding);
}

// 将SVG转为PNG并导出 - 修复边缘裁剪问题
export async function exportPng(
  svgString: string,
  filename: string = 'diagram',
  scale: number = 1,
  includeBackground: boolean = true,
  padding: number = 0
): Promise<void> {
  try {
    devLog('Starting PNG export for:', filename);
    const blob = await createPngBlob(svgString, scale, includeBackground, padding);
    saveAs(blob, `${filename}.png`);
    devLog('PNG export completed successfully');
  } catch (error) {
    if (isDev) {
      console.error('PNG export error:', error);
    }
    throw error;
  }
}

export async function exportJpg(
  svgString: string,
  filename: string = 'diagram',
  scale: number = 1,
  includeBackground: boolean = true,
  padding: number = 0
): Promise<void> {
  try {
    devLog('Starting JPG export for:', filename);
    const blob = await createJpgBlob(svgString, scale, includeBackground, padding);
    saveAs(blob, `${filename}.jpg`);
    devLog('JPG export completed successfully');
  } catch (error) {
    if (isDev) {
      console.error('JPG export error:', error);
    }
    throw error;
  }
}

export async function exportWebp(
  svgString: string,
  filename: string = 'diagram',
  scale: number = 1,
  includeBackground: boolean = true,
  padding: number = 0
): Promise<void> {
  try {
    devLog('Starting WebP export for:', filename);
    const blob = await createWebpBlob(svgString, scale, includeBackground, padding);
    saveAs(blob, `${filename}.webp`);
    devLog('WebP export completed successfully');
  } catch (error) {
    if (isDev) {
      console.error('WebP export error:', error);
    }
    throw error;
  }
}
