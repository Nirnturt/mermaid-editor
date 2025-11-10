const AppInitMark = "mermaid-editor-app-init"

try {
  performance.mark(AppInitMark)
} catch (error) {
  console.warn("[instrumentation-client] unable to mark init", error)
}

if (typeof PerformanceObserver !== "undefined") {
  const navObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === "navigation") {
        console.info("[instrumentation-client] navigation", {
          name: entry.name,
          duration: entry.duration,
        })
      }
    }
  })

  navObserver.observe({ type: "navigation", buffered: true })
} else {
  console.warn("[instrumentation-client] PerformanceObserver unavailable")
}

export function onRouterTransitionStart(url: string, navigationType: string) {
  if (typeof performance !== "undefined") {
    performance.mark(`route-transition-${url}-${navigationType}`)
  }
}
