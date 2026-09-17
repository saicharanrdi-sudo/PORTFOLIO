import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getAdjacentProjects, getContent, getProjectBySlug, getProjectSlugs } from "@/lib/content"
import ProjectDetail from "@/components/project/ProjectDetail"

export const revalidate = 60
export const dynamicParams = true

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return (await getProjectSlugs()).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [project, content] = await Promise.all([getProjectBySlug(slug), getContent()])
  if (!project) return { title: "Project not found" }
  const title = `${project.title}: ${project.subtitle} | ${content.site.name}`
  return {
    title,
    description: project.summary || undefined,
    openGraph: { title, description: project.summary || undefined, images: project.image ? [{ url: project.image }] : [] },
  }
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params
  const [project, adjacent] = await Promise.all([getProjectBySlug(slug), getAdjacentProjects(slug)])
  if (!project) notFound()
  return <ProjectDetail project={project} prev={adjacent.prev} next={adjacent.next} />
}
