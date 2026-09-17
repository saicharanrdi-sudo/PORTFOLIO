import type { Project } from "@/data/projects"

export type Social = { label: string; href: string }
export type Service = { n: string; title: string; text: string }
export type Stat = { value: number; suffix: string; label: string }
export type Role = { from: string; to: string; title: string; company: string; text: string }
export type Credential = { name: string; place: string; year: string }
export type SkillGroup = { title: string; items: string[] }
export type Tool = { name: string; icon?: string }
export type Step = { title: string; text: string; tags: string[] }
export type Testimonial = { quote: string; name: string; role: string; company: string; initials: string }

export type Content = {
  site: {
    name: string
    email: string
    bookingUrl: string
    resumeUrl: string
    location: string
    locationNote: string
    available: boolean
    availableText: string
    socials: Social[]
  }
  hero: {
    label: string
    headline: string
    highlight: string
    support: string
    marquee: string[]
  }
  about: {
    statement: string
    highlight: string
    paragraph: string
    portrait: string
    services: Service[]
    stats: Stat[]
  }
  experience: {
    heading: string
    roles: Role[]
    education: Credential[]
    /** @deprecated no longer rendered; kept so older content files still parse */
    certifications?: Credential[]
  }
  quote: {
    text: string
    highlights: string[]
    signature: string
  }
  skills: {
    heading: string
    groups: SkillGroup[]
    tools: Tool[]
  }
  process: {
    heading: string
    intro: string
    steps: Step[]
  }
  testimonials: {
    heading: string
    items: Testimonial[]
  }
  work: {
    heading: string
    intro: string
    projects: Project[]
  }
  contact: {
    headline: string
    highlight: string
    support: string
  }
}

/* ------------------------------------------------------------------ */
/* Admin form schema                                                   */
/* ------------------------------------------------------------------ */

export type FieldType = "text" | "textarea" | "number" | "boolean" | "image" | "file" | "tags" | "select" | "list"

export type Field = {
  key: string
  label: string
  type: FieldType
  help?: string
  options?: string[]
  /** Sub-fields for `list` items. Omit for a plain string list. */
  fields?: Field[]
  /** Which sub-field to show as the row title. */
  titleKey?: string
}

export type Section = { key: keyof Content; title: string; fields: Field[] }

const credential: Field[] = [
  { key: "name", label: "Name", type: "text" },
  { key: "place", label: "Institution / Issuer", type: "text" },
  { key: "year", label: "Year", type: "text" },
]

export const SCHEMA: Section[] = [
  {
    key: "site",
    title: "Site",
    fields: [
      { key: "name", label: "Your name", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "bookingUrl", label: "Booking link (Cal.com etc.)", type: "text" },
      { key: "resumeUrl", label: "Resume (PDF)", type: "file", help: "Upload a PDF. Leave empty to hide the Resume buttons." },
      { key: "location", label: "Location", type: "text" },
      { key: "locationNote", label: "Location note", type: "text" },
      { key: "available", label: "Available for new projects", type: "boolean" },
      { key: "availableText", label: "Availability text", type: "text" },
      {
        key: "socials",
        label: "Social links",
        type: "list",
        titleKey: "label",
        fields: [
          { key: "label", label: "Label", type: "text" },
          { key: "href", label: "URL", type: "text" },
        ],
      },
    ],
  },
  {
    key: "hero",
    title: "Hero",
    fields: [
      { key: "label", label: "Small label", type: "text" },
      { key: "headline", label: "Headline", type: "textarea" },
      { key: "highlight", label: "Highlighted word", type: "text", help: "Must appear in the headline; it turns orange." },
      { key: "support", label: "Supporting line", type: "textarea" },
      { key: "marquee", label: "Marquee skills", type: "tags" },
    ],
  },
  {
    key: "about",
    title: "About",
    fields: [
      { key: "statement", label: "Statement", type: "textarea" },
      { key: "highlight", label: "Highlighted phrase", type: "text" },
      { key: "paragraph", label: "Paragraph", type: "textarea" },
      { key: "portrait", label: "Portrait", type: "image" },
      {
        key: "services",
        label: "What I do",
        type: "list",
        titleKey: "title",
        fields: [
          { key: "n", label: "Number", type: "text" },
          { key: "title", label: "Title", type: "text" },
          { key: "text", label: "Description", type: "textarea" },
        ],
      },
      {
        key: "stats",
        label: "Stats",
        type: "list",
        titleKey: "label",
        fields: [
          { key: "value", label: "Value", type: "number" },
          { key: "suffix", label: "Suffix", type: "text" },
          { key: "label", label: "Label", type: "text" },
        ],
      },
    ],
  },
  {
    key: "experience",
    title: "Experience",
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      {
        key: "roles",
        label: "Roles",
        type: "list",
        titleKey: "title",
        fields: [
          { key: "from", label: "From", type: "text" },
          { key: "to", label: "To", type: "text", help: "Use “Present” for a current role." },
          { key: "title", label: "Role title", type: "text" },
          { key: "company", label: "Company", type: "text" },
          { key: "text", label: "Description", type: "textarea" },
        ],
      },
      { key: "education", label: "Education", type: "list", titleKey: "name", fields: credential },
    ],
  },
  {
    key: "quote",
    title: "Approach quote",
    fields: [
      { key: "text", label: "Quote", type: "textarea" },
      { key: "highlights", label: "Highlighted words", type: "tags" },
      { key: "signature", label: "Signature", type: "text" },
    ],
  },
  {
    key: "work",
    title: "Projects",
    fields: [
      { key: "heading", label: "/work heading", type: "text" },
      { key: "intro", label: "/work intro", type: "textarea" },
      {
        key: "projects",
        label: "Projects",
        type: "list",
        titleKey: "title",
        fields: [
          { key: "slug", label: "Slug", type: "text", help: "Unique id, lowercase, no spaces." },
          { key: "title", label: "Title", type: "text" },
          { key: "subtitle", label: "Subtitle", type: "text" },
          { key: "category", label: "Category", type: "text" },
          { key: "filters", label: "Filters", type: "tags", help: "Any of: Websites, Web Apps, Brand" },
          { key: "year", label: "Year", type: "text" },
          { key: "tags", label: "Tags", type: "tags" },
          { key: "url", label: "Live URL", type: "text" },
          { key: "image", label: "Screenshot", type: "image" },
          { key: "featured", label: "Show in home-page spiral", type: "boolean" },
        ],
      },
    ],
  },
  {
    key: "skills",
    title: "Skills & Tools",
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      {
        key: "groups",
        label: "Skill groups",
        type: "list",
        titleKey: "title",
        fields: [
          { key: "title", label: "Group title", type: "text" },
          { key: "items", label: "Skills", type: "tags" },
        ],
      },
      {
        key: "tools",
        label: "Tools",
        type: "list",
        titleKey: "name",
        fields: [
          { key: "name", label: "Tool name", type: "text" },
          { key: "icon", label: "Icon", type: "image", help: "SVG or PNG, ideally square. Leave empty to show a monogram." },
        ],
      },
    ],
  },
  {
    key: "process",
    title: "Process",
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      { key: "intro", label: "Intro", type: "textarea" },
      {
        key: "steps",
        label: "Steps",
        type: "list",
        titleKey: "title",
        fields: [
          { key: "title", label: "Title", type: "text" },
          { key: "text", label: "Description", type: "textarea" },
          { key: "tags", label: "Deliverables", type: "tags" },
        ],
      },
    ],
  },
  {
    key: "testimonials",
    title: "Testimonials",
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      {
        key: "items",
        label: "Testimonials",
        type: "list",
        titleKey: "name",
        fields: [
          { key: "quote", label: "Quote", type: "textarea" },
          { key: "name", label: "Name", type: "text" },
          { key: "role", label: "Role", type: "text" },
          { key: "company", label: "Company", type: "text" },
          { key: "initials", label: "Initials", type: "text" },
        ],
      },
    ],
  },
  {
    key: "contact",
    title: "Contact",
    fields: [
      { key: "headline", label: "Headline", type: "textarea" },
      { key: "highlight", label: "Highlighted word", type: "text" },
      { key: "support", label: "Supporting line", type: "textarea" },
    ],
  },
]
