"use client"

import { Toaster } from "react-hot-toast"
import { useTheme } from "@/components/theme-provider"

export function AppToaster() {
  const { resolvedTheme } = useTheme()

  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        duration: 4000,
        style: {
          background: "var(--card)",
          color: "var(--card-foreground)",
          border: "1px solid var(--border)",
          boxShadow: "0 12px 32px rgba(12, 12, 12, 0.18)",
          fontSize: "0.875rem",
          colorScheme: resolvedTheme ?? "light",
        },
        success: {
          iconTheme: {
            primary: "var(--primary)",
            secondary: "var(--primary-foreground)",
          },
        },
        error: {
          iconTheme: {
            primary: "var(--destructive)",
            secondary: "var(--destructive-foreground)",
          },
        },
      }}
      gutter={12}
      reverseOrder={false}
    />
  )
}
