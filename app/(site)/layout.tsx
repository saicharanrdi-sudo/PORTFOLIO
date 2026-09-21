import SmoothScroll from "@/components/SmoothScroll"
import Navbar from "@/components/Navbar"
import Contact from "@/components/Contact"
import CustomCursor from "@/components/CustomCursor"
import { ContentProvider } from "@/components/ContentProvider"
import { getContent } from "@/lib/content"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const content = await getContent()
  return (
    <ContentProvider content={content}>
      <SmoothScroll>
        <Navbar />
        {children}
        <Contact />
      </SmoothScroll>
      <CustomCursor />
    </ContentProvider>
  )
}
