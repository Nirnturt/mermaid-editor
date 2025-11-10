import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 导出图表的格式类型
export type ExportFormat = 'svg' | 'png' | 'jpg' | 'webp';
export type ExportPadding = 'none' | 'small' | 'medium' | 'large';

export const EXPORT_PADDING_VALUES: Record<ExportPadding, number> = {
  none: 0,
  small: 12,
  medium: 24,
  large: 48,
};

// 预估尺寸
export interface Size {
  width: number;
  height: number;
}

export type SvgBindFn = ((element: Element) => void) | null;

type EditorDataState = {
  code: string;
  svg: string | null;
  bindFunctions: SvgBindFn;
  exportFormat: ExportFormat;
  exportScale: number;
  includeBackground: boolean;
  exportFilename: string;
  exportPadding: ExportPadding;
  estimatedSize: Size | null;
  estimatedFileSize: string | null;
  isRendering: boolean;
  error: string | null;
  isExportPanelMinimized: boolean;
};

type EditorActions = {
  setCode: (code: string) => void;
  setRenderResult: (result: { svg: string | null; bindFunctions?: SvgBindFn }) => void;
  setExportFormat: (format: ExportFormat) => void;
  setExportScale: (scale: number) => void;
  setIncludeBackground: (include: boolean) => void;
  setEstimatedSize: (size: Size | null) => void;
  setEstimatedFileSize: (size: string | null) => void;
  setIsRendering: (isRendering: boolean) => void;
  setError: (error: string | null) => void;
  toggleExportPanelMinimized: () => void;
  setExportFilename: (filename: string) => void;
  setExportPadding: (padding: ExportPadding) => void;
  reset: () => void;
  hydrateLegacyState: () => void;
};

export type EditorState = EditorDataState & EditorActions;

// 默认Mermaid示例代码
const DEFAULT_CODE = `graph TD
    A[开始] --> B{判断条件}
    B -->|条件为真| C[处理1]
    B -->|条件为假| D[处理2]
    C --> E[结束]
    D --> E`;

const LEGACY_CODE_KEY = 'mermaid-editor-code';
const STORAGE_NAME = 'mermaid-editor-store';
const STORE_VERSION = 1;

const createNoopStorage = (): Storage => ({
  get length() {
    return 0;
  },
  clear: () => {},
  getItem: () => null,
  key: () => null,
  removeItem: () => {},
  setItem: () => {},
});

const createBaseState = (): EditorDataState => ({
  code: DEFAULT_CODE,
  svg: null,
  bindFunctions: null,
  exportFormat: 'svg',
  exportScale: 1,
  includeBackground: true,
  exportFilename: 'mermaid-diagram',
  exportPadding: 'medium',
  estimatedSize: null,
  estimatedFileSize: null,
  isRendering: false,
  error: null,
  isExportPanelMinimized: false,
});

let legacyHydrationAttempted = false;

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      ...createBaseState(),
      setCode: (newCode: string) => set({ code: newCode }),
      setRenderResult: ({ svg, bindFunctions }) =>
        set({
          svg,
          bindFunctions: bindFunctions ?? null,
        }),
      setExportFormat: (format) => set({ exportFormat: format }),
      setExportScale: (scale) => set({ exportScale: scale }),
      setIncludeBackground: (include) => set({ includeBackground: include }),
      setEstimatedSize: (size) => set({ estimatedSize: size }),
      setEstimatedFileSize: (size) => set({ estimatedFileSize: size }),
      setIsRendering: (isRendering) => set({ isRendering }),
      setError: (error) => set({ error }),
      toggleExportPanelMinimized: () =>
        set((state) => ({ isExportPanelMinimized: !state.isExportPanelMinimized })),
      setExportFilename: (filename) => set({ exportFilename: filename }),
      setExportPadding: (padding) => set({ exportPadding: padding }),
      reset: () => set(createBaseState()),
      hydrateLegacyState: () => {
        if (legacyHydrationAttempted || typeof window === 'undefined') {
          return;
        }
        legacyHydrationAttempted = true;

        const currentCode = get().code;
        if (currentCode && currentCode.trim() && currentCode !== DEFAULT_CODE) {
          return;
        }

        try {
          const legacyCode = window.localStorage.getItem(LEGACY_CODE_KEY);
          if (legacyCode && legacyCode.trim()) {
            set({ code: legacyCode });
            window.localStorage.removeItem(LEGACY_CODE_KEY);
          }
        } catch (error) {
          console.warn('[EditorStore] 迁移旧版本地存储失败:', error);
        }
      },
    }),
    {
      name: STORAGE_NAME,
      version: STORE_VERSION,
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? window.localStorage
          : createNoopStorage()
      ),
      skipHydration: true,
      partialize: (state) =>
        ({
          code: state.code,
          exportFormat: state.exportFormat,
          exportScale: state.exportScale,
          includeBackground: state.includeBackground,
          exportFilename: state.exportFilename,
          exportPadding: state.exportPadding,
          isExportPanelMinimized: state.isExportPanelMinimized,
        } satisfies Partial<EditorState>),
    }
  )
);
