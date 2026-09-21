import "server-only"
import { promises as fs } from "node:fs"
import path from "node:path"

/**
 * Where the admin's data lives.
 *
 * - Local / any Node host: files on disk (content/site.json, public/uploads).
 * - Vercel: the filesystem is read-only, so when a Blob store is connected
 *   (BLOB_READ_WRITE_TOKEN or BLOB_STORE_ID present) everything goes to Vercel Blob instead.
 *
 * The Blob store may be either public or private.
 * - Old stores:  use BLOB_READ_WRITE_TOKEN, access: "public"
 * - New stores:  use BLOB_STORE_ID + OIDC, access: "private"
 */

// Supports both old (BLOB_READ_WRITE_TOKEN) and new (BLOB_STORE_ID + OIDC) Vercel Blob auth
export const usingBlob = () =>
  !!process.env.BLOB_READ_WRITE_TOKEN || !!process.env.BLOB_STORE_ID

/** Browser-direct uploads need a read-write token; OIDC-only stores must go through the server. */
export const clientUploadsAvailable = () => !!process.env.BLOB_READ_WRITE_TOKEN

/** Public path the app serves blob uploads from (see app/api/files). */
export const FILES_ROUTE = "/api/files/"

// New OIDC-based private stores use BLOB_STORE_ID without BLOB_READ_WRITE_TOKEN
const isPrivateStore = () =>
  !!process.env.BLOB_STORE_ID && !process.env.BLOB_READ_WRITE_TOKEN

/** Build the shared extra options for put/head/del when using the new OIDC store */
function blobStoreOpts(): Record<string, unknown> {
  return isPrivateStore() && process.env.BLOB_STORE_ID
    ? { storeId: process.env.BLOB_STORE_ID }
    : {}
}

const CONTENT_PATHNAME = "content/site.json"
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads")
const CONTENT_FILE = path.join(process.cwd(), "content", "site.json")

/* ------------------------------------------------------------------ */
/* Content JSON                                                        */
/* ------------------------------------------------------------------ */

/** Returns the stored JSON text, or null when nothing has been saved yet. */
export async function readContentText(): Promise<string | null> {
  if (usingBlob()) {
    const { get, head } = await import("@vercel/blob")
    try {
      if (isPrivateStore()) {
        // Private blob: use get() which handles OIDC auth
        const result = await get(CONTENT_PATHNAME, {
          access: "private",
          useCache: false,
          ...blobStoreOpts(),
        })
        if (!result || result.statusCode !== 200 || !result.stream) return null
        // Consume the stream into text
        const reader = result.stream.getReader()
        const chunks: Uint8Array[] = []
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (value) chunks.push(value)
        }
        return new TextDecoder().decode(
          chunks.reduce((acc, chunk) => {
            const merged = new Uint8Array(acc.length + chunk.length)
            merged.set(acc)
            merged.set(chunk, acc.length)
            return merged
          }, new Uint8Array(0))
        )
      } else {
        // Public blob: fetch via CDN URL
        const meta = await head(CONTENT_PATHNAME, blobStoreOpts())
        const fetchUrl = meta.url || meta.downloadUrl
        const res = await fetch(
          `${fetchUrl}${fetchUrl.includes("?") ? "&" : "?"}t=${Date.now()}`,
          { cache: "no-store" }
        )
        if (!res.ok) return null
        return await res.text()
      }
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
      access: isPrivateStore() ? "private" : "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
      ...blobStoreOpts(),
    })
    return
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Cannot save changes: server filesystem is read-only in production. Please connect a Blob store (Storage → Blob) in your Vercel project dashboard to enable updates."
    )
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
    const pathname = `uploads/${name}`
    await put(pathname, data, {
      access: isPrivateStore() ? "private" : "public",
      addRandomSuffix: false,
      contentType,
      ...blobStoreOpts(),
    })
    // Served by the app so it works for private stores and never exposes the raw blob host
    return `${FILES_ROUTE}${pathname}`
  }
  await fs.mkdir(UPLOADS_DIR, { recursive: true })
  await fs.writeFile(path.join(UPLOADS_DIR, name), Buffer.from(data))
  return `/uploads/${name}`
}

/** Streams a blob upload for the public file route. Returns null when not on Blob or not found. */
export async function streamUpload(pathname: string): Promise<{ stream: ReadableStream; contentType: string; size: number | null } | null> {
  if (!usingBlob()) return null
  const { get } = await import("@vercel/blob")
  try {
    const result = await get(pathname, {
      access: isPrivateStore() ? "private" : "public",
      useCache: true,
      ...blobStoreOpts(),
    })
    if (!result || result.statusCode !== 200 || !result.stream) return null
    return { stream: result.stream, contentType: result.blob.contentType || "application/octet-stream", size: result.blob.size ?? null }
  } catch {
    return null
  }
}

/** Blob pathname behind an app-served upload URL, or null. */
const blobPathnameOf = (url: string) => (url.startsWith(FILES_ROUTE + "uploads/") && !url.includes("..") ? url.slice(FILES_ROUTE.length) : null)

/** True when the URL points at something this app uploaded (and so may delete). */
export function isUploadUrl(url: string): boolean {
  if (blobPathnameOf(url)) return true
  if (url.startsWith("/uploads/")) return !url.includes("..")
  try {
    const u = new URL(url)
    return (
      (u.hostname.endsWith(".public.blob.vercel-storage.com") ||
        u.hostname.endsWith(".private.blob.vercel-storage.com")) &&
      u.pathname.startsWith("/uploads/")
    )
  } catch {
    return false
  }
}

export async function removeUpload(url: string): Promise<void> {
  if (!isUploadUrl(url)) throw new Error("Not an uploaded file.")
  const blobPath = blobPathnameOf(url)
  if (blobPath || url.startsWith("http")) {
    const { del } = await import("@vercel/blob")
    await del(blobPath ?? url, blobStoreOpts())
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
