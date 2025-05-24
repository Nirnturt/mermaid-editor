import { create } from 'zustand';

// 导出图表的格式类型
export type ExportFormat = 'svg' | 'png';

// 预估尺寸
export interface Size {
  width: number;
  height: number;
}

const LOCAL_STORAGE_CODE_KEY = 'mermaid-editor-code';

// 编辑器状态接口
interface EditorState {
  // Mermaid代码
  code: string;
  // 当前预览SVG内容
  svg: string | null;
  // 导出设置
  exportFormat: ExportFormat;
  exportScale: number;
  includeBackground: boolean;
  exportFilename: string;
  estimatedSize: Size | null;
  estimatedFileSize: string | null;
  // 图表是否正在渲染
  isRendering: boolean;
  // 错误信息
  error: string | null;
  // 导出面板是否最小化
  isExportPanelMinimized: boolean;
  
  // 更新代码
  setCode: (code: string) => void;
  // 更新SVG
  setSvg: (svg: string | null) => void;
  // 设置导出格式
  setExportFormat: (format: ExportFormat) => void;
  // 设置导出缩放比例
  setExportScale: (scale: number) => void;
  // 设置是否包含背景
  setIncludeBackground: (include: boolean) => void;
  // 设置预估尺寸
  setEstimatedSize: (size: Size | null) => void;
  // 设置预估文件大小
  setEstimatedFileSize: (size: string | null) => void;
  // 设置渲染状态
  setIsRendering: (isRendering: boolean) => void;
  // 设置错误
  setError: (error: string | null) => void;
  // 切换导出面板最小化状态
  toggleExportPanelMinimized: () => void;
  // 设置导出文件名
  setExportFilename: (filename: string) => void;
  // 重置所有状态
  reset: () => void;
  // 从localStorage加载代码
  loadCodeFromStorage: () => void;
}

// 默认Mermaid示例代码
const DEFAULT_CODE = `graph TD
    A[开始] --> B{判断条件}
    B -->|条件为真| C[处理1]
    B -->|条件为假| D[处理2]
    C --> E[结束]
    D --> E`;

// 安全的localStorage操作
const safeLocalStorageGet = (key: string): string | null => {
  try {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`Failed to read from localStorage (${key}):`, error);
    return null;
  }
};

const safeLocalStorageSet = (key: string, value: string): void => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Failed to write to localStorage (${key}):`, error);
  }
};

// 创建状态管理
export const useEditorStore = create<EditorState>((set, get) => ({
  code: DEFAULT_CODE, // Initial value, will be overridden by localStorage if present
  svg: null,
  exportFormat: 'svg',
  exportScale: 1,
  includeBackground: true,
  exportFilename: 'mermaid-diagram',
  estimatedSize: null,
  estimatedFileSize: null,
  isRendering: false,
  error: null,
  isExportPanelMinimized: false,

  setCode: (newCode: string) => {
    set({ code: newCode });
    safeLocalStorageSet(LOCAL_STORAGE_CODE_KEY, newCode);
  },
  setSvg: (svg) => set({ svg }),
  setExportFormat: (format) => set({ exportFormat: format }),
  setExportScale: (scale) => set({ exportScale: scale }),
  setIncludeBackground: (include) => set({ includeBackground: include }),
  setEstimatedSize: (size) => set({ estimatedSize: size }),
  setEstimatedFileSize: (size) => set({ estimatedFileSize: size }),
  setIsRendering: (isRendering) => set({ isRendering }),
  setError: (error) => set({ error }),
  setExportFilename: (filename) => set({ exportFilename: filename }),
  toggleExportPanelMinimized: () => set((state) => ({ isExportPanelMinimized: !state.isExportPanelMinimized })),
  reset: () => {
    set({ 
      code: DEFAULT_CODE, 
      svg: null,
      exportFormat: 'svg',
      exportScale: 1,
      includeBackground: true,
      exportFilename: 'mermaid-diagram',
      estimatedSize: null,
      estimatedFileSize: null,
      isRendering: false,
      error: null,
      isExportPanelMinimized: false
    });
    safeLocalStorageSet(LOCAL_STORAGE_CODE_KEY, DEFAULT_CODE);
  },
  loadCodeFromStorage: () => {
    const savedCode = safeLocalStorageGet(LOCAL_STORAGE_CODE_KEY);
    if (savedCode && savedCode.trim()) {
      set({ code: savedCode });
    }
  },
}));

// Immediately attempt to load code from storage when the store is initialized
// REMOVED: if (typeof window !== 'undefined') { 
// REMOVED:  useEditorStore.getState().loadCodeFromStorage();
// REMOVED: } 

// Immediately attempt to load code from storage when the store is initialized
// REMOVED: if (typeof window !== 'undefined') { 
// REMOVED:  useEditorStore.getState().loadCodeFromStorage();
// REMOVED: } 