import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getContent, saveContent } from "@/lib/content"
import { usingBlob } from "@/lib/storage"
import type { Content } from "@/lib/content-types"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const content = await getContent()
    return NextResponse.json(
      {
        content,
        storage: {
          usingBlob: usingBlob(),
          isReadOnly: !usingBlob() && process.env.NODE_ENV === "production",
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    )
  } catch (error: any) {
    console.error("[admin/content GET]", error)
    return NextResponse.json(
      { error: "Failed to read content: " + (error?.message || String(error)) },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // In production on Vercel, writing to disk is not possible.
    // BLOB_READ_WRITE_TOKEN must be set (connect a Blob store in the Vercel dashboard).
    if (process.env.NODE_ENV === "production" && !usingBlob()) {
      const msg =
        "Cannot save: no Blob store connected. Go to your Vercel project → Storage → Connect Store → Blob, then redeploy."
      console.error("[admin/content POST]", msg)
      return NextResponse.json({ error: msg }, { status: 503 })
    }

    const body = (await request.json()) as Content
    await saveContent(body)

    // Revalidate public routes so live site reflects new content immediately
    revalidatePath("/", "layout")
    revalidatePath("/")
    revalidatePath("/work")
    revalidatePath("/work/[slug]", "page")

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("[admin/content POST]", error)
    const code = error?.code
    if (code === "EROFS" || code === "EACCES") {
      return NextResponse.json(
        {
          error:
            "Filesystem is read-only (Vercel production). Connect a Blob store: Vercel dashboard → Storage → Connect Store → Blob, then redeploy.",
        },
        { status: 503 }
      )
    }
    // Surface the real error message — never swallow it
    const msg = error?.message || String(error) || "Unknown error saving content"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
