"use client"

import { useReportWebVitals } from "next/web-vitals"

type MetricPayload = Parameters<NonNullable<Parameters<typeof useReportWebVitals>[0]>>[0]

const METRIC_EVENT = "mermaid-editor-web-vitals"

const DEFAULT_METRICS_ENDPOINT = "/api/metrics"
const METRICS_ENDPOINT = process.env.NEXT_PUBLIC_METRICS_ENDPOINT ?? DEFAULT_METRICS_ENDPOINT

function sendToAnalytics(metric: MetricPayload) {
  if (METRICS_ENDPOINT && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    try {
      const body = JSON.stringify(metric)
      navigator.sendBeacon(METRICS_ENDPOINT, body)
      return
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[MetricsReporter] Failed to send beacon", error)
      }
    }
  }

  if (METRICS_ENDPOINT && typeof fetch !== "undefined") {
    fetch(METRICS_ENDPOINT, {
      method: "POST",
      body: JSON.stringify(metric),
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
      },
    }).catch((error) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[MetricsReporter] Failed to send fetch fallback", error)
      }
    })
    return
  }

  if (process.env.NODE_ENV !== "production") {
    console.info(`[WebVitals] ${metric.name}`, metric)
  }
}

export function MetricsReporter() {
  useReportWebVitals((metric) => {
    sendToAnalytics(metric)

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(METRIC_EVENT, { detail: metric }))
    }
  })

  return null
}
