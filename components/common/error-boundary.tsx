"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangleIcon, RefreshCw, Home } from "lucide-react";
import { toast } from "sonner";
// Import i18n files directly for class component usage
import enMessages from "@/messages/en.json";
import zhMessages from "@/messages/zh.json";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'component' | 'section' | 'page'; // 错误级别
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorType: 'unknown' | 'render' | 'async' | 'network' | 'storage' | 'mermaid';
  retryCount: number;
  isRetrying: boolean;
}

// 错误分类函数
function categorizeError(error: Error): State['errorType'] {
  const errorMessage = error.message.toLowerCase();
  const errorStack = error.stack?.toLowerCase() || '';

  if (errorMessage.includes('mermaid') || errorMessage.includes('diagram')) {
    return 'mermaid';
  }
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return 'network';
  }
  if (errorMessage.includes('localstorage') || errorMessage.includes('storage')) {
    return 'storage';
  }
  if (errorStack.includes('promise') || errorMessage.includes('async')) {
    return 'async';
  }
  if (errorMessage.includes('render') || errorStack.includes('render')) {
    return 'render';
  }
  return 'unknown';
}

// 错误日志记录
function logError(error: Error, errorInfo: ErrorInfo, errorType: string, retryCount: number) {
  const errorReport = {
    timestamp: new Date().toISOString(),
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    errorInfo: {
      componentStack: errorInfo.componentStack,
    },
    errorType,
    retryCount,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
  };

  // 记录到控制台
  console.group('🚨 ErrorBoundary Caught Error');
  console.error('Error:', error);
  console.error('Error Info:', errorInfo);
  console.error('Error Type:', errorType);
  console.error('Retry Count:', retryCount);
  console.error('Full Report:', errorReport);
  console.groupEnd();

  // 这里可以添加外部错误报告服务
  // 例如：Sentry, LogRocket, 或自定义API
  // if (typeof window !== 'undefined' && window.gtag) {
  //   window.gtag('event', 'exception', {
  //     description: error.message,
  //     fatal: false
  //   });
  // }
}

class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  public state: State = {
    hasError: false,
    errorType: 'unknown',
    retryCount: 0,
    isRetrying: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
      hasError: true, 
      error,
      errorType: categorizeError(error),
      isRetrying: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorType = categorizeError(error);
    
    // 记录错误
    logError(error, errorInfo, errorType, this.state.retryCount);
    
    // 调用外部错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({ 
      errorInfo,
      errorType,
    });

    // 根据错误类型显示不同的toast
    if (typeof window !== 'undefined') {
      const messages = this.getCurrentMessages();
      switch (errorType) {
        case 'network':
          toast.error(messages.errorBoundary.networkError || 'Network error occurred');
          break;
        case 'mermaid':
          toast.error(messages.errorBoundary.mermaidError || 'Diagram rendering error');
          break;
        case 'storage':
          toast.error(messages.errorBoundary.storageError || 'Storage error occurred');
          break;
        default:
          toast.error(messages.errorBoundary.generalError || 'An error occurred');
      }
    }
  }

  private getCurrentMessages() {
    let currentMessages = enMessages; // Default to English
    try {
      const storedLang = typeof localStorage !== "undefined" ? localStorage.getItem("mermaid-editor-language") : null;
      if (storedLang === 'zh') {
        currentMessages = zhMessages;
      }
    } catch (e) {
      console.warn("Could not access localStorage for language in ErrorBoundary: ", e);
    }
    return currentMessages;
  }

  private handleReset = () => {
    const { level = 'component' } = this.props;
    
    this.setState({ isRetrying: true });

    // 根据错误类型和级别决定恢复策略
    if (this.state.errorType === 'network' && this.state.retryCount < 3) {
      // 网络错误：尝试重新连接
      this.resetTimeoutId = setTimeout(() => {
        this.setState({ 
          hasError: false, 
          error: undefined, 
          errorInfo: undefined,
          retryCount: this.state.retryCount + 1,
          isRetrying: false,
        });
      }, 1000);
    } else if (this.state.errorType === 'mermaid') {
      // Mermaid错误：清理状态并重置
      if (typeof window !== 'undefined') {
        // 清理 Mermaid 状态
        try {
          const mermaidElements = document.querySelectorAll('.mermaid');
          mermaidElements.forEach(el => el.remove());
        } catch (e) {
          console.warn('Failed to clean up mermaid elements:', e);
        }
      }
      this.setState({ 
        hasError: false, 
        error: undefined, 
        errorInfo: undefined,
        retryCount: this.state.retryCount + 1,
        isRetrying: false,
      });
    } else if (level === 'page' || this.state.retryCount >= 3) {
      // 页面级错误或重试次数过多：重新加载页面
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } else {
      // 其他情况：简单重置
      this.setState({ 
        hasError: false, 
        error: undefined, 
        errorInfo: undefined,
        retryCount: this.state.retryCount + 1,
        isRetrying: false,
      });
    }
  };

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  public componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  public render() {
    if (this.state.hasError) {
      const currentMessages = this.getCurrentMessages();
      const { level = 'component' } = this.props;
      
      const errorTypeMessages = {
        network: currentMessages.errorBoundary.networkError || 'Network connection error. Please check your internet connection.',
        mermaid: currentMessages.errorBoundary.mermaidError || 'Diagram rendering error. Please check your diagram syntax.',
        storage: currentMessages.errorBoundary.storageError || 'Storage error. Please check your browser settings.',
        async: currentMessages.errorBoundary.asyncError || 'Asynchronous operation error.',
        render: currentMessages.errorBoundary.renderError || 'Component rendering error.',
        unknown: currentMessages.errorBoundary.defaultError || 'An unexpected error occurred.'
      };

      const errorMessage = errorTypeMessages[this.state.errorType] || errorTypeMessages.unknown;
      const generalErrorTitle = currentMessages.errorBoundary.title;
      const detailsText = currentMessages.errorBoundary.details;
      const resetText = currentMessages.errorBoundary.tryAgain;
      const homeText = currentMessages.errorBoundary.goHome || 'Go Home';

      // 根据错误级别调整样式
      const containerClass = level === 'page' 
        ? "flex flex-col items-center justify-center min-h-screen w-full p-4 bg-background"
        : "flex flex-col items-center justify-center h-full w-full p-4 bg-background/50 backdrop-blur-sm";

      return (
        <div 
          className={containerClass}
          role="alert"
        >
          <div className="bg-destructive/10 p-6 rounded-lg shadow-md max-w-md text-center border border-destructive/30">
            <div className="flex flex-col items-center gap-3 mb-4">
              <AlertTriangleIcon className="w-12 h-12 text-destructive" strokeWidth={1.5} />
              <h2 className="text-2xl font-semibold text-destructive">
                {generalErrorTitle}
              </h2>
            </div>
            
            <p className="text-destructive/80 mb-4">
              {this.props.fallbackMessage || errorMessage}
            </p>

            {/* 重试计数显示 */}
            {this.state.retryCount > 0 && (
              <p className="text-xs text-muted-foreground mb-3">
                Retry attempts: {this.state.retryCount}/3
              </p>
            )}

            {/* 操作按钮 */}
            <div className="flex flex-col gap-2 mb-4">
              <Button 
                onClick={this.handleReset}
                disabled={this.state.isRetrying}
                variant="default"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {this.state.isRetrying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {resetText}
                  </>
                )}
              </Button>
              
              {(level === 'page' || this.state.retryCount >= 2) && (
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="border-muted-foreground/20"
                >
                  <Home className="w-4 h-4 mr-2" />
                  {homeText}
                </Button>
              )}
            </div>

            {/* 错误详情 */}
            {this.state.error && (
              <details className="text-left text-xs bg-destructive/5 p-2 rounded border border-destructive/20">
                <summary className="cursor-pointer text-destructive/70 hover:text-destructive/90 mb-2">{detailsText}</summary>
                <div className="space-y-2">
                  <div>
                    <strong>Error Type:</strong> {this.state.errorType}
                  </div>
                  <div>
                    <strong>Message:</strong>
                    <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-destructive/60 text-xs">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  {this.state.errorInfo && this.state.errorInfo.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-destructive/60 text-xs">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 