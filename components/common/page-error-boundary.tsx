"use client";

import type { ReactNode } from "react";
import ErrorBoundary from "@/components/common/error-boundary";
import { useLanguage } from "@/components/language-provider";
import enMessages from "@/messages/en.json";
import zhMessages from "@/messages/zh.json";

type PageErrorBoundaryProps = {
  children: ReactNode;
};

export function PageErrorBoundary({ children }: PageErrorBoundaryProps) {
  const { language } = useLanguage();
  const messages = language === "zh" ? zhMessages : enMessages;
  const fallbackMessage = messages.app.editorErrorFallback;

  return (
    <ErrorBoundary fallbackMessage={fallbackMessage} level="page">
      {children}
    </ErrorBoundary>
  );
}
