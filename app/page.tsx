import { Header } from "@/components/header"
import { MermaidEditor } from "@/components/editor/mermaid-editor"
import { PageErrorBoundary } from "@/components/common/page-error-boundary"

export default function Home() {
  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <Header />
      <main className="flex w-full flex-1 flex-col overflow-hidden">
        <PageErrorBoundary>
          <MermaidEditor />
        </PageErrorBoundary>
      </main>
    </div>
  )
}
