import type { Metadata } from "next"
import WorkGallery from "@/components/work/WorkGallery"

export const metadata: Metadata = {
  title: "Work — Sai Charan Reddy",
  description: "Selected projects, designed and built: brand websites, web apps, and interactive experiences.",
}

export default function WorkPage() {
  return <WorkGallery />
}
