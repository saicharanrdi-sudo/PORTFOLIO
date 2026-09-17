import { NextResponse } from "next/server"
import { promises as fs } from "node:fs"
import path from "node:path"

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

const UPLOADS = path.join(process.cwd(), "public", "uploads")

/** Resolves a public URL like /uploads/x.pdf to a path inside the uploads folder, or null if it escapes it. */
function resolveUpload(url: string): string | null {
  if (!url.startsWith("/uploads/")) return null
  const target = path.resolve(UPLOADS, url.slice("/uploads/".length))
  return target.startsWith(UPLOADS + path.sep) ? target : null
}

/** Stores an uploaded image or PDF under /public/uploads and returns its public URL. */
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
  await fs.mkdir(UPLOADS, { recursive: true })
  await fs.writeFile(path.join(UPLOADS, name), Buffer.from(await file.arrayBuffer()))

  return NextResponse.json({ url: `/uploads/${name}` })
}

/** Deletes a previously uploaded file. Only paths inside /public/uploads are accepted. */
export async function DELETE(request: Request) {
  const url = new URL(request.url).searchParams.get("url") || ""
  const target = resolveUpload(url)
  if (!target) return NextResponse.json({ error: "Not an uploaded file." }, { status: 400 })
  try {
    await fs.unlink(target)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err
  }
  return NextResponse.json({ ok: true })
}
