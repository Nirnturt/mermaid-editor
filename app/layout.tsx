import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-provider";
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mermaid Editor",
  description: "Create and export Mermaid diagrams easily",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function getThemePreference() {
                  if (typeof localStorage !== 'undefined') {
                    const stored = localStorage.getItem('mermaid-editor-theme');
                    if (stored) return stored;
                  }
                  return 'system';
                }
                
                function applyTheme() {
                  const theme = getThemePreference();
                  const root = document.documentElement;
                  
                  root.classList.remove('light', 'dark');
                  
                  if (theme === 'system') {
                    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    root.classList.add(isDark ? 'dark' : 'light');
                  } else {
                    root.classList.add(theme);
                  }
                }
                
                // 立即应用主题
                applyTheme();
                
                // 监听系统主题变化
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
                  if (getThemePreference() === 'system') {
                    applyTheme();
                  }
                });
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system" storageKey="mermaid-editor-theme">
          <LanguageProvider defaultLanguage="en" storageKey="mermaid-editor-language">
            {children}
            <Toaster richColors closeButton position="bottom-right" />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
