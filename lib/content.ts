import "server-only"
import { promises as fs } from "node:fs"
import path from "node:path"
import type { Content } from "./content-types"
import { normalizeProject, type Project } from "@/data/projects"

/**
 * Content storage adapter. Everything the admin edits goes through here, so
 * swapping the JSON file for a database or blob store touches only this file.
 */
const FILE = path.join(process.cwd(), "content", "site.json")

export async function getContent(): Promise<Content> {
  const raw = await fs.readFile(FILE, "utf8")
  const content = JSON.parse(raw) as Content
  content.work.projects = content.work.projects.map(normalizeProject)
  // Older content files stored tools as plain strings
  content.skills.tools = (content.skills.tools as unknown[]).map((t) =>
    typeof t === "string" ? { name: t, icon: "" } : (t as { name: string; icon?: string }),
  )
  return content
}

export async function saveContent(content: Content): Promise<void> {
  const tmp = `${FILE}.tmp`
  await fs.writeFile(tmp, JSON.stringify(content, null, 2) + "\n", "utf8")
  await fs.rename(tmp, FILE)
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
