"use client"

/**
 * Uploads a file from the admin. On Vercel (Blob connected) the browser sends
 * the file straight to Blob storage; locally it posts to the server.
 */
type Mode = { mode: "client" | "server"; maxBytes: number }
let modePromise: Promise<Mode> | null = null

const getMode = () => {
  modePromise ??= fetch("/api/admin/upload")
    .then((r) => (r.ok ? r.json() : {}))
    .then((d: { mode?: string; maxBytes?: number }) => ({
      mode: d.mode === "client" ? ("client" as const) : ("server" as const),
      maxBytes: d.maxBytes || 20 * 1024 * 1024,
    }))
    .catch(() => ({ mode: "server" as const, maxBytes: 4 * 1024 * 1024 }))
  return modePromise
}

/** Reads a JSON error from a response, or falls back to the HTTP status so nothing is swallowed. */
async function readError(res: Response, fallback: string) {
  const text = await res.text()
  try {
    const data = JSON.parse(text) as { error?: string }
    return data.error || fallback
  } catch {
    return `${fallback} (HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ""})`
  }
}

const safeName = (name: string) => {
  const dot = name.lastIndexOf(".")
  const ext = dot >= 0 ? name.slice(dot).toLowerCase() : ""
  const base = (dot >= 0 ? name.slice(0, dot) : name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "file"
  return `${base}-${Date.now().toString(36)}${ext}`
}

export async function uploadFile(file: File): Promise<string> {
  const { mode, maxBytes } = await getMode()
  if (file.size > maxBytes) {
    throw new Error(`File is ${(file.size / 1024 / 1024).toFixed(1)} MB; the limit here is ${Math.floor(maxBytes / 1024 / 1024)} MB. Try compressing it.`)
  }
  if (mode === "client") {
    const { upload } = await import("@vercel/blob/client")
    const blob = await upload(`uploads/${safeName(file.name)}`, file, {
      access: "public",
      handleUploadUrl: "/api/admin/upload",
      contentType: file.type,
    })
    return blob.url
  }
  const body = new FormData()
  body.append("file", file)
  const res = await fetch("/api/admin/upload", { method: "POST", body })
  if (!res.ok) throw new Error(await readError(res, "Upload failed"))
  const data = (await res.json()) as { url?: string }
  if (!data.url) throw new Error("Upload failed: no URL returned")
  return data.url
}

export async function deleteFile(url: string): Promise<void> {
  const res = await fetch(`/api/admin/upload?url=${encodeURIComponent(url)}`, { method: "DELETE" })
  if (!res.ok) throw new Error(await readError(res, "Delete failed"))
}
