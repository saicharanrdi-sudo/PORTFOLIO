import { NextResponse } from "next/server"
import path from "node:path"
import { storeUpload, removeUpload, isUploadUrl, usingBlob } from "@/lib/storage"

const MAX_IMAGE = 8 * 1024 * 1024
const MAX_FILE = 20 * 1024 * 1024
const TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "image/avif": ".avif",
  "application/pdf": ".pdf",
}

const fail = (message: string, status = 500) => NextResponse.json({ error: message }, { status })

const explain = (err: unknown) => {
  const code = (err as NodeJS.ErrnoException)?.code
  if (code === "EROFS" || code === "EACCES") {
    return "This server can't write files. On Vercel, connect a Blob store (Storage → Blob) to the project and redeploy."
  }
  return err instanceof Error ? err.message : "Upload failed."
}

/** Tells the admin which upload path to use. */
export async function GET() {
  return NextResponse.json({ mode: usingBlob() ? "blob" : "local" })
}

/**
 * Two flavours of POST:
 * - JSON body: the @vercel/blob client-upload handshake (browser → Blob directly,
 *   so Vercel's 4.5 MB request limit never applies).
 * - multipart body: a direct upload stored by the server (local development).
 */
export async function POST(request: Request) {
  try {
    if (request.headers.get("content-type")?.includes("application/json")) {
      if (!usingBlob()) return fail("Blob storage isn't configured on this server.", 400)
      const { handleUpload } = await import("@vercel/blob/client")
      const body = await request.json()
      const result = await handleUpload({
        request,
        body,
        onBeforeGenerateToken: async () => ({
          allowedContentTypes: Object.keys(TYPES),
          maximumSizeInBytes: MAX_FILE,
          addRandomSuffix: false,
          allowOverwrite: false,
        }),
        onUploadCompleted: async () => {},
      })
      return NextResponse.json(result)
    }

    const form = await request.formData()
    const file = form.get("file")
    if (!(file instanceof File)) return fail("No file provided.", 400)
    const ext = TYPES[file.type]
    if (!ext) return fail("Unsupported file type.", 415)
    const limit = ext === ".pdf" ? MAX_FILE : MAX_IMAGE
    if (file.size > limit) return fail(`File must be under ${limit / 1024 / 1024} MB.`, 413)

    const url = await storeUpload(uploadName(file.name, ext), await file.arrayBuffer(), file.type)
    return NextResponse.json({ url })
  } catch (err) {
    console.error("[admin/upload]", err)
    return fail(explain(err))
  }
}

/** Deletes a previously uploaded file. Only URLs this app produced are accepted. */
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url).searchParams.get("url") || ""
    if (!isUploadUrl(url)) return fail("Not an uploaded file.", 400)
    await removeUpload(url)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[admin/upload]", err)
    return fail(explain(err))
  }
}

function uploadName(original: string, ext: string) {
  const base = path.parse(original).name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "file"
  return `${base}-${Date.now().toString(36)}${ext}`
}
