import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-provider";
import { AppToaster } from "@/components/ui/toaster";
import { MetricsReporter } from "@/components/metrics-reporter";
import { defaultLocale } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"] });

const APP_TITLE = "Mermaid Editor";
const APP_DESCRIPTION = "Create and export Mermaid diagrams easily";
const OG_IMAGE = "/img/pc-en.png";

const resolveAppUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3003";
};

const APP_URL = resolveAppUrl();

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: APP_TITLE,
    template: "%s | Mermaid Editor",
  },
  description: APP_DESCRIPTION,
  openGraph: {
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    siteName: APP_TITLE,
    url: APP_URL,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Mermaid Editor preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang={defaultLocale} suppressHydrationWarning>
      <head>
        <Script
          id="theme-preference"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined' || typeof document === 'undefined') {
                  return;
                }

                if (!window.matchMedia) {
                  document.documentElement.classList.add('light');
                  return;
                }

                function getThemePreference() {
                  try {
                    const stored = window.localStorage.getItem('mermaid-editor-theme');
                    if (stored) return stored;
                  } catch (_) {}
                  return 'system';
                }

                function applyResolvedTheme(nextTheme) {
                  var resolved = nextTheme;
                  if (nextTheme === 'system') {
                    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }

                  var root = document.documentElement;
                  root.classList.remove('light', 'dark');
                  root.classList.add(resolved);
                  root.dataset.theme = resolved;
                  root.style.colorScheme = resolved;
                }

                function applyTheme() {
                  var theme = getThemePreference();
                  applyResolvedTheme(theme);
                }

                applyTheme();

                var media = window.matchMedia('(prefers-color-scheme: dark)');
                media.addEventListener('change', function() {
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
          <LanguageProvider defaultLanguage={defaultLocale} storageKey="mermaid-editor-language">
            {children}
            <AppToaster />
            <MetricsReporter />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
