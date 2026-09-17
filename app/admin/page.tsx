"use client"

import { useEffect, useRef, useState } from "react"
import { SCHEMA, type Content, type Field } from "@/lib/content-types"

export default function AdminPage() {
  const [content, setContent] = useState<Content | null>(null)
  const [initialContent, setInitialContent] = useState<Content | null>(null)
  const [activeSection, setActiveSection] = useState<keyof Content>("site")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")
  const [statusMessage, setStatusMessage] = useState("")

  useEffect(() => {
    fetch("/api/admin/content")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load content")
        return res.json()
      })
      .then((data: Content) => {
        setContent(data)
        setInitialContent(JSON.parse(JSON.stringify(data)))
        setLoading(false)
      })
      .catch((err) => {
        setStatusMessage("Error loading content: " + err.message)
        setSaveStatus("error")
        setLoading(false)
      })
  }, [])

  const handleSave = async () => {
    if (!content) return
    setSaving(true)
    setSaveStatus("idle")
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      })
      if (!res.ok) throw new Error("Failed to save")
      setInitialContent(JSON.parse(JSON.stringify(content)))
      setSaveStatus("success")
      setStatusMessage("Changes saved successfully!")
      setTimeout(() => setSaveStatus("idle"), 3500)
    } catch (err: any) {
      setSaveStatus("error")
      setStatusMessage("Failed to save changes: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (!initialContent) return
    if (confirm("Are you sure you want to discard all unsaved changes?")) {
      setContent(JSON.parse(JSON.stringify(initialContent)))
      setSaveStatus("idle")
    }
  }

  const updateSectionField = (sectionKey: keyof Content, fieldKey: string, value: any) => {
    setContent((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [sectionKey]: {
          ...(prev[sectionKey] as any),
          [fieldKey]: value,
        },
      }
    })
  }

  const currentSectionSchema = SCHEMA.find((s) => s.key === activeSection)

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-neutral-500">
          <div className="size-4 animate-spin rounded-full border-2 border-neutral-300 border-t-[#ff5b1f]" />
          <span>Loading portfolio content...</span>
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Failed to load content from server. Please check the console.
      </div>
    )
  }

  const isDirty = JSON.stringify(content) !== JSON.stringify(initialContent)

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#e6e4df] bg-white p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#111111]">
            Content Management
          </h1>
          <p className="text-xs text-[#6b6b6b] mt-0.5">
            Edit text, projects, testimonials, and site details. Changes update your live website.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === "success" && (
            <span className="text-xs font-medium text-emerald-600 animate-fade-in flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {statusMessage}
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-xs font-medium text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
              {statusMessage}
            </span>
          )}
          {isDirty && (
            <button
              onClick={handleReset}
              disabled={saving}
              className="rounded-full border border-[#e6e4df] px-4 py-2 text-xs font-medium text-[#6b6b6b] transition-colors hover:border-[#111111] hover:text-[#111111]"
            >
              Discard Changes
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold text-white shadow-sm transition-all ${
              saving || !isDirty
                ? "bg-[#ff5b1f]/50 cursor-not-allowed"
                : "bg-[#ff5b1f] hover:bg-[#e54a12] active:scale-95"
            }`}
          >
            {saving ? (
              <>
                <span className="size-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Saving...
              </>
            ) : (
              <>Save Changes {isDirty && "•"}</>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar Tabs + Editor */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Navigation Tabs */}
        <aside className="lg:col-span-1">
          <nav className="flex flex-row overflow-x-auto lg:flex-col gap-1 rounded-2xl border border-[#e6e4df] bg-white p-2 shadow-sm">
            {SCHEMA.map((sec) => {
              const active = sec.key === activeSection
              return (
                <button
                  key={sec.key}
                  onClick={() => setActiveSection(sec.key)}
                  className={`flex items-center justify-between whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-[#111111] text-white shadow-sm"
                      : "text-[#6b6b6b] hover:bg-[#f2f0eb] hover:text-[#111111]"
                  }`}
                >
                  <span>{sec.title}</span>
                  {active && <span className="hidden lg:inline text-[10px] opacity-70">→</span>}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Section Editor Form */}
        <div className="lg:col-span-3 space-y-6">
          {currentSectionSchema && (
            <div className="rounded-2xl border border-[#e6e4df] bg-white p-6 shadow-sm">
              <div className="border-b border-[#e6e4df] pb-4 mb-6">
                <h2 className="text-lg font-semibold tracking-tight text-[#111111]">
                  {currentSectionSchema.title}
                </h2>
                <p className="text-xs text-[#6b6b6b] mt-1">
                  Manage configuration and copy for the {currentSectionSchema.title.toLowerCase()} section.
                </p>
              </div>

              <div className="space-y-6">
                {currentSectionSchema.fields.map((field) => (
                  <FieldRenderer
                    key={field.key}
                    field={field}
                    value={(content[activeSection] as any)?.[field.key]}
                    onChange={(val) => updateSectionField(activeSection, field.key, val)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: Field
  value: any
  onChange: (val: any) => void
}) {
  if (field.type === "image") {
    return <ImageField field={field} value={value ?? ""} onChange={onChange} />
  }

  if (field.type === "file") {
    return <FileField field={field} value={value ?? ""} onChange={onChange} />
  }

  if (field.type === "text") {
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-[#111111]">
          {field.label}
        </label>
        {field.help && <p className="text-[11px] text-[#6b6b6b]">{field.help}</p>}
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${field.label.toLowerCase()}...`}
          className="w-full rounded-xl border border-[#e6e4df] bg-[#fafaf7] px-3.5 py-2 text-xs text-[#111111] transition-colors focus:border-[#111111] focus:bg-white focus:outline-none"
        />
      </div>
    )
  }

  if (field.type === "number") {
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-[#111111]">
          {field.label}
        </label>
        {field.help && <p className="text-[11px] text-[#6b6b6b]">{field.help}</p>}
        <input
          type="number"
          value={value ?? 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full rounded-xl border border-[#e6e4df] bg-[#fafaf7] px-3.5 py-2 text-xs text-[#111111] transition-colors focus:border-[#111111] focus:bg-white focus:outline-none"
        />
      </div>
    )
  }

  if (field.type === "textarea") {
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-[#111111]">
          {field.label}
        </label>
        {field.help && <p className="text-[11px] text-[#6b6b6b]">{field.help}</p>}
        <textarea
          rows={3}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${field.label.toLowerCase()}...`}
          className="w-full rounded-xl border border-[#e6e4df] bg-[#fafaf7] px-3.5 py-2 text-xs text-[#111111] transition-colors focus:border-[#111111] focus:bg-white focus:outline-none"
        />
      </div>
    )
  }

  if (field.type === "boolean") {
    return (
      <div className="flex items-center justify-between rounded-xl border border-[#e6e4df] bg-[#fafaf7] p-3.5">
        <div>
          <span className="block text-xs font-semibold text-[#111111]">
            {field.label}
          </span>
          {field.help && <p className="text-[11px] text-[#6b6b6b]">{field.help}</p>}
        </div>
        <button
          type="button"
          onClick={() => onChange(!value)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            value ? "bg-[#ff5b1f]" : "bg-neutral-300"
          }`}
        >
          <span
            className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              value ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    )
  }

  if (field.type === "tags") {
    const tags: string[] = Array.isArray(value) ? value : []
    const handleTagInput = (str: string) => {
      const parts = str.split(",").map((s) => s.trim()).filter(Boolean)
      onChange(parts)
    }

    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-[#111111]">
          {field.label}
        </label>
        {field.help && <p className="text-[11px] text-[#6b6b6b]">{field.help}</p>}
        <input
          type="text"
          value={tags.join(", ")}
          onChange={(e) => handleTagInput(e.target.value)}
          placeholder="Separate items with commas (e.g. Design, React, Figma)..."
          className="w-full rounded-xl border border-[#e6e4df] bg-[#fafaf7] px-3.5 py-2 text-xs text-[#111111] transition-colors focus:border-[#111111] focus:bg-white focus:outline-none"
        />
        <div className="flex flex-wrap gap-1.5 pt-1">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 rounded-md bg-[#f2f0eb] px-2 py-0.5 text-[11px] font-medium text-[#111111]"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(tags.filter((_, i) => i !== idx))}
                className="text-neutral-400 hover:text-red-500"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (field.type === "list") {
    const list: any[] = Array.isArray(value) ? value : []
    const subFields = field.fields ?? []

    const addItem = () => {
      const newItem: any = {}
      subFields.forEach((sf) => {
        newItem[sf.key] = sf.type === "number" ? 0 : sf.type === "boolean" ? false : sf.type === "tags" ? [] : ""
      })
      onChange([...list, newItem])
    }

    const removeItem = (index: number) => {
      onChange(list.filter((_, i) => i !== index))
    }

    const updateItemField = (index: number, subKey: string, subVal: any) => {
      const updated = list.map((item, i) => (i === index ? { ...item, [subKey]: subVal } : item))
      onChange(updated)
    }

    return (
      <div className="space-y-3 rounded-2xl border border-[#e6e4df] bg-[#fafaf7] p-4">
        <div className="flex items-center justify-between border-b border-[#e6e4df] pb-3">
          <div>
            <span className="text-xs font-semibold text-[#111111]">{field.label}</span>
            <span className="ml-2 text-[11px] text-[#6b6b6b]">({list.length} items)</span>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="rounded-full bg-[#111111] px-3 py-1 text-[11px] font-medium text-white shadow-sm hover:bg-[#333333]"
          >
            + Add item
          </button>
        </div>

        {list.length === 0 ? (
          <p className="py-4 text-center text-xs text-[#6b6b6b]">No items yet. Click &ldquo;+ Add item&rdquo; to add one.</p>
        ) : (
          <div className="space-y-3">
            {list.map((item, index) => {
              const titleValue = field.titleKey && item[field.titleKey] ? item[field.titleKey] : `Item #${index + 1}`
              return (
                <div
                  key={index}
                  className="rounded-xl border border-[#e6e4df] bg-white p-4 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                    <span className="flex items-center gap-2.5 text-xs font-semibold text-[#111111]">
                      {typeof item.image === "string" && item.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image} alt="" className="size-8 rounded-md border border-[#e6e4df] object-cover" />
                      )}
                      {String(titleValue)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {subFields.map((subField) => (
                      <div
                        key={subField.key}
                        className={subField.type === "textarea" ? "sm:col-span-2" : ""}
                      >
                        <FieldRenderer
                          field={subField}
                          value={item[subField.key]}
                          onChange={(newVal) => updateItemField(index, subField.key, newVal)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return null
}

function ImageField({ field, value, onChange }: { field: Field; value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const upload = async (file: File) => {
    setBusy(true)
    setError("")
    const body = new FormData()
    body.append("file", file)
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed")
      onChange(data.url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-[#111111]">{field.label}</label>
      {field.help && <p className="text-[11px] text-[#6b6b6b]">{field.help}</p>}
      <div className="flex items-start gap-3">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e6e4df] bg-[#f2f0eb]">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-[11px] text-[#6b6b6b]">No image</span>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/uploads/… or https://…"
            className="w-full rounded-xl border border-[#e6e4df] bg-[#fafaf7] px-3.5 py-2 text-xs text-[#111111] transition-colors focus:border-[#111111] focus:bg-white focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="rounded-full bg-[#111111] px-3 py-1.5 text-[11px] font-medium text-white shadow-sm hover:bg-[#333333] disabled:opacity-60"
            >
              {busy ? "Uploading…" : "Upload image"}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="rounded-full border border-[#e6e4df] px-3 py-1.5 text-[11px] font-medium text-[#6b6b6b] hover:border-[#111111] hover:text-[#111111]"
              >
                Remove
              </button>
            )}
          </div>
          {error && <p className="text-[11px] text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  )
}

/** Uploaded files (PDFs) live under /uploads and can be deleted from the server. */
const isUploaded = (url: string) => url.startsWith("/uploads/") || /\.public\.blob\.vercel-storage\.com\/uploads\//.test(url)

function FileField({ field, value, onChange }: { field: Field; value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<"upload" | "delete" | null>(null)
  const [error, setError] = useState("")

  const upload = async (file: File) => {
    setBusy("upload")
    setError("")
    const body = new FormData()
    body.append("file", file)
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed")
      // Replace: remove the previous uploaded file so it doesn't linger on disk
      if (value && isUploaded(value) && value !== data.url) {
        await fetch(`/api/admin/upload?url=${encodeURIComponent(value)}`, { method: "DELETE" }).catch(() => {})
      }
      onChange(data.url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(null)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const remove = async () => {
    if (!value) return
    if (isUploaded(value)) {
      if (!confirm("Delete this file from the server?")) return
      setBusy("delete")
      setError("")
      try {
        const res = await fetch(`/api/admin/upload?url=${encodeURIComponent(value)}`, { method: "DELETE" })
        const data = (await res.json()) as { error?: string }
        if (!res.ok) throw new Error(data.error || "Delete failed")
      } catch (err: any) {
        setError(err.message)
        setBusy(null)
        return
      }
      setBusy(null)
    }
    onChange("")
  }

  const name = value ? value.split("/").pop() : ""

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-[#111111]">{field.label}</label>
      {field.help && <p className="text-[11px] text-[#6b6b6b]">{field.help}</p>}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#e6e4df] bg-[#fafaf7] p-3.5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#ffe8dd] text-[10px] font-bold text-[#ff5b1f]">
          PDF
        </span>
        <div className="min-w-0 flex-1">
          {value ? (
            <a href={value} target="_blank" rel="noopener noreferrer" className="block truncate text-xs font-medium text-[#111111] underline underline-offset-2">
              {name}
            </a>
          ) : (
            <span className="text-xs text-[#6b6b6b]">No resume uploaded</span>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => inputRef.current?.click()}
          className="rounded-full bg-[#111111] px-3 py-1.5 text-[11px] font-medium text-white shadow-sm hover:bg-[#333333] disabled:opacity-60"
        >
          {busy === "upload" ? "Uploading…" : value ? "Replace PDF" : "Upload PDF"}
        </button>
        {value && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={remove}
            className="rounded-full border border-red-200 px-3 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            {busy === "delete" ? "Deleting…" : "Delete"}
          </button>
        )}
      </div>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
      <p className="text-[11px] text-[#6b6b6b]">Remember to click Save Changes after uploading or deleting.</p>
    </div>
  )
}
