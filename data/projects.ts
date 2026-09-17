export const FILTERS = ["All", "Websites", "Web Apps", "Brand"] as const
export type Filter = (typeof FILTERS)[number]
export type ProjectFilter = Exclude<Filter, "All">

export const PROJECT_TYPES = ["", "Client Project", "Concept Project", "Personal Project"] as const
export type ProjectType = (typeof PROJECT_TYPES)[number]

export type Feature = { title: string; text: string; image?: string }
export type DesignColor = { name: string; hex: string }
export type DesignSystem = { colors: DesignColor[]; headingFont: string; bodyFont: string; notes: string }
export type GalleryItem = { image: string; caption: string }

export type Project = {
  slug: string
  title: string
  /** Shown under the title everywhere; the case-study "tagline". */
  subtitle: string
  category: string
  filters: ProjectFilter[]
  year: string
  /** Role tags (e.g. "UI/UX Design"). */
  tags: string[]
  url: string
  /** Cover image path under /public. Empty for a named placeholder. */
  image?: string
  /** Shown in the home-page spiral. */
  featured?: boolean

  // ---- Case study (all optional; empty values hide their section) ----
  projectType?: ProjectType
  duration?: string
  tools?: string[]
  /** One sentence, used on cards and for SEO description. */
  summary?: string
  overview?: string
  challenge?: string
  approach?: string
  outcome?: string
  skillsShown?: string[]
  features?: Feature[]
  designSystem?: DesignSystem
  gallery?: GalleryItem[]
}

export const EMPTY_DESIGN_SYSTEM: DesignSystem = { colors: [], headingFont: "", bodyFont: "", notes: "" }

/** Fills in defaults so consumers can rely on every case-study field existing. */
export function normalizeProject(p: Project): Required<Project> {
  return {
    ...p,
    image: p.image ?? "",
    featured: p.featured ?? false,
    projectType: p.projectType ?? "",
    duration: p.duration ?? "",
    tools: p.tools ?? [],
    summary: p.summary ?? "",
    overview: p.overview ?? "",
    challenge: p.challenge ?? "",
    approach: p.approach ?? "",
    outcome: p.outcome ?? "",
    skillsShown: p.skillsShown ?? [],
    features: p.features ?? [],
    designSystem: { ...EMPTY_DESIGN_SYSTEM, ...(p.designSystem ?? {}) },
    gallery: p.gallery ?? [],
  }
}

/** Editors leave bracketed placeholders like "[Add outcome]"; treat those as empty. */
export const isPlaceholder = (v: string | undefined) => !v || v.trim().startsWith("[")
