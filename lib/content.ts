import "server-only"
import type { Content } from "./content-types"
import { normalizeProject, type Project } from "@/data/projects"
import { readContentText, writeContentText } from "./storage"
import seed from "@/content/site.json"

/**
 * Content access. Storage (disk locally, Vercel Blob when deployed) is handled
 * in lib/storage.ts; the JSON checked into the repo seeds a fresh store.
 */
export async function getContent(): Promise<Content> {
  const raw = await readContentText()
  const content = (raw ? JSON.parse(raw) : structuredClone(seed)) as Content
  content.work.projects = content.work.projects.map(normalizeProject)
  // Older content files stored tools as plain strings
  content.skills.tools = (content.skills.tools as unknown[]).map((t) =>
    typeof t === "string" ? { name: t, icon: "" } : (t as { name: string; icon?: string }),
  )
  return content
}

export async function saveContent(content: Content): Promise<void> {
  await writeContentText(JSON.stringify(content, null, 2) + "\n")
}

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

export async function getProjects(): Promise<Required<Project>[]> {
  const { work } = await getContent()
  return work.projects.map(normalizeProject)
}

export async function getProjectSlugs(): Promise<string[]> {
  return (await getProjects()).map((p) => p.slug)
}

export async function getProjectBySlug(slug: string): Promise<Required<Project> | null> {
  return (await getProjects()).find((p) => p.slug === slug) ?? null
}

/** Neighbours in admin order, wrapping around so the last project's "next" is the first. */
export async function getAdjacentProjects(slug: string): Promise<{ prev: Required<Project> | null; next: Required<Project> | null }> {
  const all = await getProjects()
  const i = all.findIndex((p) => p.slug === slug)
  if (i < 0 || all.length < 2) return { prev: null, next: null }
  return { prev: all[(i - 1 + all.length) % all.length], next: all[(i + 1) % all.length] }
}
