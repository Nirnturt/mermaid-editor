import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center text-foreground">
      <div className="space-y-4 rounded-lg border border-border/60 bg-card/50 p-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold">404 · Not Found</h1>
          <p className="text-muted-foreground">The page or diagram you requested does not exist.</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">未找到页面或图表，请检查链接是否正确。</p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          返回首页 / Back Home
        </Link>
      </div>
    </div>
  )
}
