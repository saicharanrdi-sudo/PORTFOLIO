import "server-only"
import { promises as fs } from "node:fs"
import path from "node:path"

/**
 * Where the admin's data lives.
 *
 * - Local / any Node host: files on disk (content/site.json, public/uploads).
 * - Vercel: the filesystem is read-only, so when a Blob store is connected
 *   (BLOB_READ_WRITE_TOKEN present) everything goes to Vercel Blob instead.
 */
export const usingBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN

const CONTENT_PATHNAME = "content/site.json"
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads")
const CONTENT_FILE = path.join(process.cwd(), "content", "site.json")

/* ------------------------------------------------------------------ */
/* Content JSON                                                        */
/* ------------------------------------------------------------------ */

/** Returns the stored JSON text, or null when nothing has been saved yet. */
export async function readContentText(): Promise<string | null> {
  if (usingBlob()) {
    const { head } = await import("@vercel/blob")
    try {
      const meta = await head(CONTENT_PATHNAME)
      // Blob URLs sit behind a CDN; the query string defeats any stale copy
      const res = await fetch(`${meta.url}?t=${Date.now()}`, { cache: "no-store" })
      if (!res.ok) return null
      return await res.text()
    } catch {
      return null
    }
  }
  try {
    return await fs.readFile(CONTENT_FILE, "utf8")
  } catch {
    return null
  }
}

export async function writeContentText(text: string): Promise<void> {
  if (usingBlob()) {
    const { put } = await import("@vercel/blob")
    await put(CONTENT_PATHNAME, text, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    })
    return
  }
  const tmp = `${CONTENT_FILE}.tmp`
  await fs.writeFile(tmp, text, "utf8")
  await fs.rename(tmp, CONTENT_FILE)
}

/* ------------------------------------------------------------------ */
/* Uploaded files                                                      */
/* ------------------------------------------------------------------ */

/** Stores a file and returns the public URL to reference it by. */
export async function storeUpload(name: string, data: ArrayBuffer, contentType: string): Promise<string> {
  if (usingBlob()) {
    const { put } = await import("@vercel/blob")
    const blob = await put(`uploads/${name}`, data, { access: "public", addRandomSuffix: false, contentType })
    return blob.url
  }
  await fs.mkdir(UPLOADS_DIR, { recursive: true })
  await fs.writeFile(path.join(UPLOADS_DIR, name), Buffer.from(data))
  return `/uploads/${name}`
}

/** True when the URL points at something this app uploaded (and so may delete). */
export function isUploadUrl(url: string): boolean {
  if (url.startsWith("/uploads/")) return !url.includes("..")
  try {
    const u = new URL(url)
    return u.hostname.endsWith(".public.blob.vercel-storage.com") && u.pathname.startsWith("/uploads/")
  } catch {
    return false
  }
}

export async function removeUpload(url: string): Promise<void> {
  if (!isUploadUrl(url)) throw new Error("Not an uploaded file.")
  if (url.startsWith("http")) {
    const { del } = await import("@vercel/blob")
    await del(url)
    return
  }
  const target = path.resolve(UPLOADS_DIR, url.slice("/uploads/".length))
  if (!target.startsWith(UPLOADS_DIR + path.sep)) throw new Error("Not an uploaded file.")
  try {
    await fs.unlink(target)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err
  }
}
