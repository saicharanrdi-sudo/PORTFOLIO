import { NextResponse } from "next/server"
import { streamUpload } from "@/lib/storage"

/**
 * Serves files the admin uploaded to Vercel Blob. Needed because the store is
 * private: visitors can't fetch blob URLs directly, so the app streams them.
 * Upload names carry a timestamp, so responses are safe to cache for a long time.
 */
export async function GET(_request: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  const pathname = path.join("/")
  if (!pathname.startsWith("uploads/") || pathname.includes("..")) {
    return new NextResponse("Not found", { status: 404 })
  }
  const file = await streamUpload(pathname)
  if (!file) return new NextResponse("Not found", { status: 404 })
  return new NextResponse(file.stream, {
    headers: {
      "Content-Type": file.contentType,
      ...(file.size ? { "Content-Length": String(file.size) } : {}),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
