"use client"

import { createContext, useContext } from "react"
import type { Content } from "@/lib/content-types"

const ContentContext = createContext<Content | null>(null)

export function ContentProvider({ content, children }: { content: Content; children: React.ReactNode }) {
  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>
}

export function useContent(): Content {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error("useContent must be used inside <ContentProvider>")
  return ctx
}
