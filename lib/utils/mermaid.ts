"use client"

import mermaid from 'mermaid';
import { saveAs } from 'file-saver';
import { Size } from '@/store/editor-store';
import { lightTheme, darkTheme } from '@/config/mermaid-themes';

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

// Initialize Mermaid with theme support
function initializeMermaidWithCurrentTheme() {
  const currentTheme = getCurrentAppTheme();
  const isDark = currentTheme === 'dark';
  
  // console.log('[MermaidJS] Initializing with theme:', currentTheme);
  mermaid.initialize({
    startOnLoad: false, // We manually render
    theme: 'base', // Use 'base' to apply themeVariables correctly
    themeVariables: isDark ? darkTheme : lightTheme,
    securityLevel: 'loose',
    fontFamily: 'sans-serif', // Consistent font
  });
}

// Initialize on client side and set up observer
if (typeof window !== 'undefined') {
  initializeMermaidWithCurrentTheme(); // Initial call

  // Only create and observe if an observer doesn't already exist for this session
  if (!themeObserverInstance && document.documentElement) {
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
  }
}

// 渲染Mermaid图表为SVG字符串 - 使用官方推荐的渲染方式
export async function renderMermaid(code: string): Promise<string> {
  // Ensure Mermaid is initialized with the latest theme settings before rendering
  // This is crucial if the theme might have changed since the last global initialization.
  initializeMermaidWithCurrentTheme();

  try {
    const container = document.createElement('div');
    container.style.visibility = 'hidden';
    container.style.position = 'absolute'; // 确保不影响布局
    document.body.appendChild(container);
    
    // 更友好的错误处理，确保输出有意义的错误信息
    try {
      const { svg } = await mermaid.render('mermaid-diagram-' + Date.now(), code, container);
      document.body.removeChild(container);
      return svg;
    } catch (mermaidError: unknown) {
      console.error('Mermaid render error:', mermaidError);
      
      // 处理特定类型的错误，给用户更友好的提示
      const errorMessage = mermaidError instanceof Error ? mermaidError.message : String(mermaidError);
      const isZh = typeof window !== 'undefined' && window.navigator.language?.startsWith('zh');
      
      // 对常见错误进行更友好的提示
      let friendlyMessage: string;
      
      if (errorMessage.includes("No diagram type detected") || errorMessage.includes("Unknown diagram type")) {
        friendlyMessage = isZh 
          ? '未检测到图表类型。请确保代码以有效的图表类型声明开始，例如：\n- 流程图：graph TD\n- 时序图：sequenceDiagram\n- 类图：classDiagram\n- 饼图：pie\n等等'
          : 'No diagram type detected. Please start your code with a valid diagram type like:\n- Flowchart: graph TD\n- Sequence: sequenceDiagram\n- Class: classDiagram\n- Pie: pie\netc.';
      }
      else if (errorMessage.includes("Lexical error") || errorMessage.includes("Parse error")) {
        friendlyMessage = isZh
          ? '语法错误：检查您的代码中是否存在拼写错误、缺失括号或引号等问题'
          : 'Syntax error: Check for typos, missing brackets, or quotes in your code';
      }
      else if (errorMessage.includes("Undefined") || errorMessage.includes("not defined")) {
        friendlyMessage = isZh
          ? '引用错误：检查您的代码中是否存在未定义的元素或ID'
          : 'Reference error: Check for undefined elements or IDs in your code';
      }
      else if (errorMessage.includes("already") && errorMessage.includes("defined")) {
        friendlyMessage = isZh
          ? '重复定义错误：同一元素或ID被定义了多次'
          : 'Duplicate definition: The same element or ID is defined multiple times';
      }
      else if (errorMessage.length > 200) {
        // 如果错误消息过长，可能是内部错误，提供简化版本
        friendlyMessage = isZh
          ? '图表解析错误：请检查语法并简化您的图表'
          : 'Diagram parsing error: Please check syntax and simplify your diagram';
      }
      else {
        friendlyMessage = errorMessage;
      }
      
      throw new Error(friendlyMessage);
    }
  } catch (error: unknown) {
    console.error('Error during Mermaid rendering:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred during diagram rendering');
  }
}

// 优化SVG以提高兼容性并防止边缘裁剪
export function optimizeSvg(svgString: string): string {
  try {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgElement = svgDoc.querySelector('svg');
    
    if (!svgElement) {
      console.warn('No SVG element found in string');
      return svgString;
    }

    // 获取精确的尺寸和边界框信息
    const size = getSvgSize(svgString);
    console.log('SVG optimization - calculated size:', size);

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
          console.log('SVG optimization - getBBox result:', bbox);
        }
      } catch (e) {
        console.warn('getBBox failed in SVG optimization:', e);
      }
    }
    
    document.body.removeChild(temp);

    // 计算安全边距和最终viewBox
    const safetyMargin = 10; // SVG的安全边距可以稍小一些
    let finalViewBox: string;
    
    if (bbox) {
      // 使用精确的边界框信息
      const leftEdge = Math.min(0, bbox.x) - safetyMargin;
      const topEdge = Math.min(0, bbox.y) - safetyMargin;
      const rightEdge = Math.max(bbox.x + bbox.width, size.width - safetyMargin * 2);
      const bottomEdge = Math.max(bbox.y + bbox.height, size.height - safetyMargin * 2);
      
      const viewBoxWidth = rightEdge - leftEdge + safetyMargin * 2;
      const viewBoxHeight = bottomEdge - topEdge + safetyMargin * 2;
      
      finalViewBox = `${leftEdge} ${topEdge} ${viewBoxWidth} ${viewBoxHeight}`;
      
      // 同时更新SVG的宽高以匹配viewBox
      svgElement.setAttribute('width', String(Math.ceil(viewBoxWidth)));
      svgElement.setAttribute('height', String(Math.ceil(viewBoxHeight)));
    } else {
      // 回退方案：使用计算出的尺寸
      finalViewBox = `${-safetyMargin} ${-safetyMargin} ${size.width} ${size.height}`;
      svgElement.setAttribute('width', String(size.width));
      svgElement.setAttribute('height', String(size.height));
    }
    
    // 设置优化后的viewBox
    svgElement.setAttribute('viewBox', finalViewBox);
    console.log('SVG optimization - final viewBox:', finalViewBox);
    
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
    
    console.log('SVG optimization complete');
    return optimizedSvgString;
    
  } catch (error) {
    console.error('SVG optimization error:', error);
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
export function getSvgSize(svgString: string): Size {
  try {
    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.visibility = 'hidden';
    temp.style.pointerEvents = 'none';
    temp.style.top = '-9999px';
    temp.style.left = '-9999px';
    temp.innerHTML = svgString;
    document.body.appendChild(temp);

    const svgElement = temp.querySelector('svg') as SVGSVGElement | null;

    if (svgElement) {
      // 确保SVG有合适的初始样式
      svgElement.style.display = 'block';
      svgElement.style.maxWidth = 'none';
      svgElement.style.maxHeight = 'none';
      
      let finalWidth = 0;
      let finalHeight = 0;

      try {
        // 方法1: 使用getBBox获取内容边界
        const bbox = svgElement.getBBox();
        if (bbox && bbox.width > 1 && bbox.height > 1) {
          // 计算实际需要的尺寸，包括偏移
          const rightEdge = bbox.x + bbox.width;
          const bottomEdge = bbox.y + bbox.height;
          const leftEdge = Math.min(0, bbox.x);
          const topEdge = Math.min(0, bbox.y);
          
          finalWidth = Math.max(rightEdge - leftEdge, bbox.width);
          finalHeight = Math.max(bottomEdge - topEdge, bbox.height);
          
          console.log('Using getBBox method:', { bbox, finalWidth, finalHeight });
        }
      } catch (e) {
        console.warn('getBBox failed:', e);
      }

      // 方法2: 如果getBBox失败，使用getBoundingClientRect
      if (finalWidth <= 1 || finalHeight <= 1) {
        try {
          const rect = svgElement.getBoundingClientRect();
          if (rect.width > 1 && rect.height > 1) {
            finalWidth = rect.width;
            finalHeight = rect.height;
            console.log('Using getBoundingClientRect method:', { rect, finalWidth, finalHeight });
          }
        } catch (e) {
          console.warn('getBoundingClientRect failed:', e);
        }
      }

      // 方法3: 使用SVG属性
      if (finalWidth <= 1 || finalHeight <= 1) {
        if (svgElement.hasAttribute('width') && svgElement.hasAttribute('height')) {
          const widthAttr = parseFloat(svgElement.getAttribute('width')!);
          const heightAttr = parseFloat(svgElement.getAttribute('height')!);
          if (widthAttr > 1 && heightAttr > 1) {
            finalWidth = widthAttr;
            finalHeight = heightAttr;
            console.log('Using width/height attributes:', { finalWidth, finalHeight });
          }
        }
      }

      // 方法4: 使用viewBox
      if (finalWidth <= 1 || finalHeight <= 1) {
        if (svgElement.hasAttribute('viewBox')) {
          const viewBox = svgElement.getAttribute('viewBox');
          if (viewBox) {
            const parts = viewBox.split(/[\s,]+/).map(parseFloat);
            if (parts.length === 4 && parts[2] > 1 && parts[3] > 1) {
              finalWidth = parts[2];
              finalHeight = parts[3];
              console.log('Using viewBox method:', { viewBox, finalWidth, finalHeight });
            }
          }
        }
      }

      document.body.removeChild(temp);

      if (finalWidth > 1 && finalHeight > 1) {
        // 添加更大的安全边距以防止任何可能的裁剪
        const safetyMargin = 20;
        return { 
          width: Math.ceil(finalWidth) + safetyMargin, 
          height: Math.ceil(finalHeight) + safetyMargin 
        };
      }
    }

    document.body.removeChild(temp);

    // 最后的备用方案：解析字符串
    const widthMatch = svgString.match(/width=["']([\d.]+)["']/);
    const heightMatch = svgString.match(/height=["']([\d.]+)["']/);
    if (widthMatch && heightMatch) {
      const width = parseFloat(widthMatch[1]);
      const height = parseFloat(heightMatch[1]);
      if (width > 1 && height > 1) {
        const safetyMargin = 20;
        return { 
          width: Math.ceil(width) + safetyMargin, 
          height: Math.ceil(height) + safetyMargin 
        };
      }
    }
    
    console.warn('Unable to determine SVG size, using default values');
    return { width: 800, height: 600 };

  } catch (error) {
    console.error('Critical error in getSvgSize:', error);
    return { width: 800, height: 600 };
  }
}

// 估算文件大小 - 调整PNG估算
export function estimateFileSize(svgString: string, format: string, scale: number = 1): string {
  try {
    const size = getSvgSize(svgString); // 获取紧密尺寸
    const scaledWidth = size.width * scale;
    const scaledHeight = size.height * scale;
    const pixelCount = scaledWidth * scaledHeight;
    
    let estimatedBytes = 0;

    if (format === 'svg') {
      estimatedBytes = new Blob([svgString]).size;
    } else if (format === 'png') {
      let svgDensity = 0;
      if (size.width > 0 && size.height > 0) {
        svgDensity = svgString.length / (size.width * size.height);
      }
      let bytesPerPixelPostCompression = 0.1; 
      if (svgDensity > 10) { 
        bytesPerPixelPostCompression = 0.25;
      } else if (svgDensity > 2) {
        bytesPerPixelPostCompression = 0.15;
      }
      estimatedBytes = pixelCount * bytesPerPixelPostCompression;
    }

    if (estimatedBytes < 0) estimatedBytes = 0; 

    if (estimatedBytes < 1024) {
      return `${Math.round(estimatedBytes)} B`;
    } else if (estimatedBytes < 1024 * 1024) {
      return `${(estimatedBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  } catch (error) {
    console.error('Error estimating file size:', error);
    return 'Unknown';
  }
}

// 导出SVG - 改进的导出流程
export async function exportSvg(svgString: string, filename: string = 'diagram'): Promise<void> {
  try {
    console.log('Starting SVG export for:', filename);
    console.log('Original SVG string length:', svgString.length);
    
    const optimizedSvg = optimizeSvg(svgString);
    console.log('Optimized SVG string length:', optimizedSvg.length);
    
    const blob = new Blob([optimizedSvg], { type: 'image/svg+xml;charset=utf-8' });
    console.log('Created SVG blob, size:', blob.size);
    
    saveAs(blob, `${filename}.svg`);
    console.log('SVG export completed successfully');
  } catch (error) {
    console.error('SVG export error:', error);
    throw new Error(`Failed to export SVG: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 将SVG转为PNG并导出 - 修复边缘裁剪问题
export async function exportPng(
  svgElementPassed: HTMLElement, 
  filename: string = 'diagram', 
  scale: number = 1, 
  includeBackground: boolean = true
): Promise<void> {
  try {
    const svgString = svgElementPassed.outerHTML;
    console.log('Original SVG string length:', svgString.length);
    
    // 获取更精确的尺寸
    const originalSize = getSvgSize(svgString);
    console.log('Calculated original size:', originalSize);

    // 计算最终尺寸，确保有足够的边距
    const extraPadding = 30; // 增加更多的安全边距
    const baseWidth = originalSize.width;
    const baseHeight = originalSize.height;
    const targetWidth = Math.round(baseWidth * scale) + extraPadding * 2;
    const targetHeight = Math.round(baseHeight * scale) + extraPadding * 2;

    if (targetWidth <= 0 || targetHeight <= 0) {
        throw new Error(`Invalid target dimensions for PNG: ${targetWidth}x${targetHeight}`);
    }
    
    console.log(`PNG Export - Base: ${baseWidth}x${baseHeight}, Scale: ${scale}, Final: ${targetWidth}x${targetHeight}, Background: ${includeBackground}`);

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
    const rootSvgElement = svgDoc.querySelector('svg');

    if (!rootSvgElement) {
      throw new Error('Invalid SVG: Root SVG element not found');
    }

    // 保存原始viewBox（如果存在）
    const originalViewBox = rootSvgElement.getAttribute('viewBox');
    console.log('Original viewBox:', originalViewBox);

    // 设置新的SVG属性
    rootSvgElement.setAttribute('width', String(targetWidth));
    rootSvgElement.setAttribute('height', String(targetHeight));
    
    // 重新计算viewBox以确保内容居中且不被裁剪
    let newViewBox: string;
    if (originalViewBox) {
      // 如果有原始viewBox，使用它并添加边距
      const parts = originalViewBox.split(/[\s,]+/).map(parseFloat);
      if (parts.length === 4) {
        const [x, y, width, height] = parts;
        const paddingInViewBox = extraPadding / scale;
        newViewBox = `${x - paddingInViewBox} ${y - paddingInViewBox} ${width + paddingInViewBox * 2} ${height + paddingInViewBox * 2}`;
      } else {
        // 如果原始viewBox格式有问题，创建一个新的
        const paddingInViewBox = extraPadding / scale;
        newViewBox = `${-paddingInViewBox} ${-paddingInViewBox} ${baseWidth} ${baseHeight}`;
      }
    } else {
      // 如果没有原始viewBox，创建一个包含边距的新viewBox
      const paddingInViewBox = extraPadding / scale;
      newViewBox = `${-paddingInViewBox} ${-paddingInViewBox} ${baseWidth} ${baseHeight}`;
    }
    
    rootSvgElement.setAttribute('viewBox', newViewBox);
    console.log('New viewBox:', newViewBox);
    
    // 确保preserveAspectRatio设置正确
    rootSvgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    // 添加xmlns属性确保独立SVG有效
    if (!rootSvgElement.hasAttribute('xmlns')) {
      rootSvgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }

    const processedSvgString = new XMLSerializer().serializeToString(rootSvgElement);
    console.log('Processed SVG string length:', processedSvgString.length);

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // 设置高质量渲染
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 应用背景色（如果需要）
      if (includeBackground) {
        const isDark = document.documentElement.classList.contains('dark');
        const backgroundColor = isDark ? '#222222' : '#ffffff';
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      const img = new Image();
      
      img.onload = () => {
        console.log('Image loaded successfully, drawing to canvas...');
        try {
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob from canvas'));
              return;
            }
            console.log('PNG blob created successfully, size:', blob.size);
            saveAs(blob, `${filename}.png`);
            resolve();
          }, 'image/png', 1.0); // 使用最高质量
          
        } catch (drawError) {
          console.error('Error drawing image to canvas:', drawError);
          reject(new Error('Failed to draw image to canvas'));
        }
      };

      img.onerror = (err) => {
        console.error('Image load error for PNG export:', err);
        console.error('SVG content (first 1000 chars):', processedSvgString.substring(0, 1000));
        reject(new Error('Failed to load SVG image for PNG conversion'));
      };
      
      // 创建Data URL时使用更安全的编码
      try {
        const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(processedSvgString)}`;
        console.log('Setting image source...');
        img.src = svgDataUrl;
      } catch (encodeError) {
        console.error('Error encoding SVG to data URL:', encodeError);
        reject(new Error('Failed to encode SVG to data URL'));
      }
    });
  } catch (error) {
    console.error('PNG export error:', error);
    throw error;
  }
} 