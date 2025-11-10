import { NextResponse } from "next/server"

const isDev = process.env.NODE_ENV !== "production"

export async function POST(request: Request) {
  try {
    const metric = await request.json()

    if (isDev) {
      console.info("[api/metrics] web-vitals received", {
        name: metric?.name,
        id: metric?.id,
        rating: metric?.rating,
      })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    if (isDev) {
      console.error("[api/metrics] invalid payload", error)
    }
    return NextResponse.json({ received: false, error: "Invalid payload" }, { status: 400 })
  }
}

export function GET() {
  return NextResponse.json(
    { error: "Use POST with a Web Vitals payload" },
    { status: 405, headers: { Allow: "POST" } }
  )
}
