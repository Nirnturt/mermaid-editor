"use client"

import { Toaster as ToasterProvider } from "sonner"
import { useTheme } from "@/components/theme-provider"

interface ToasterProps {
  closeButton?: boolean
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center"
  richColors?: boolean
  theme?: "light" | "dark" | "system"
}

export function Toaster({
  closeButton = false,
  position = "bottom-right",
  richColors = true,
  theme: customTheme,
  ...props
}: ToasterProps = {}) {
  const { theme } = useTheme()
  const toastTheme = customTheme || theme || "system"

  return (
    <ToasterProvider
      closeButton={closeButton}
      position={position}
      richColors={richColors}
      theme={toastTheme}
      {...props}
    />
  )
}

export { toast } from "sonner" 