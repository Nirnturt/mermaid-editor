import { Header } from "@/components/header"
// import { Footer } from "@/components/footer" // Removed Footer import
import { MermaidEditor } from "@/components/editor/mermaid-editor"
import { HydrationWarning } from "@/components/hydration-warning"
import ErrorBoundary from "@/components/common/error-boundary"; // Import ErrorBoundary

export default function Home() {
  return (
    <div className="flex flex-col bg-background text-foreground h-screen w-full">
      <Header />
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        <HydrationWarning />
        <ErrorBoundary fallbackMessage="The editor encountered an issue. Please try again." level="page"> 
          <MermaidEditor />
        </ErrorBoundary>
      </main>
      {/* <Footer /> */}{/* Removed Footer component */}
    </div>
  )
}
