import { performance, PerformanceObserver } from "perf_hooks"

const bootTime = new Date().toISOString()
console.info(`[instrumentation] Node runtime registered at ${bootTime}`)

const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.info("[instrumentation] measure", entry.name, entry.duration.toFixed(2))
  }
})

observer.observe({ entryTypes: ["measure"] })

performance.mark("mermaid-editor-start")
