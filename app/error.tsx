"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import enMessages from "@/messages/en.json"
import zhMessages from "@/messages/zh.json"

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const { language } = useLanguage()
  const messages = language === "zh" ? zhMessages : enMessages

  useEffect(() => {
    console.error("[app/error] boundary captured error", error)
  }, [error])

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex flex-col items-center gap-4 rounded-lg border border-destructive/40 bg-destructive/10 p-8 shadow-sm">
        <AlertTriangle className="h-10 w-10 text-destructive" strokeWidth={1.5} />
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-destructive">
            {messages.errorBoundary.title}
          </h1>
          <p className="text-sm text-destructive/80">
            {messages.errorBoundary.defaultError}
          </p>
        </div>
        <Button
          onClick={reset}
          variant="default"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {messages.errorBoundary.tryAgain}
        </Button>
      </div>
    </div>
  )
}
