import { NextResponse } from "next/server"
import path from "node:path"
import { storeUpload, removeUpload, isUploadUrl } from "@/lib/storage"

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

/** Stores an uploaded image or PDF and returns its public URL. */
export async function POST(request: Request) {
  const form = await request.formData()
  const file = form.get("file")
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided." }, { status: 400 })
  const ext = TYPES[file.type]
  if (!ext) return NextResponse.json({ error: "Unsupported file type." }, { status: 415 })
  const limit = ext === ".pdf" ? MAX_FILE : MAX_IMAGE
  if (file.size > limit) return NextResponse.json({ error: `File must be under ${limit / 1024 / 1024} MB.` }, { status: 413 })

  const base = path.parse(file.name).name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "file"
  const name = `${base}-${Date.now().toString(36)}${ext}`
  const url = await storeUpload(name, await file.arrayBuffer(), file.type)
  return NextResponse.json({ url })
}

/** Deletes a previously uploaded file. Only URLs this app produced are accepted. */
export async function DELETE(request: Request) {
  const url = new URL(request.url).searchParams.get("url") || ""
  if (!isUploadUrl(url)) return NextResponse.json({ error: "Not an uploaded file." }, { status: 400 })
  await removeUpload(url)
  return NextResponse.json({ ok: true })
}
