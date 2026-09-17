import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getContent, saveContent } from "@/lib/content"
import type { Content } from "@/lib/content-types"

export async function GET() {
  try {
    const content = await getContent()
    return NextResponse.json(content)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read content" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Content
    await saveContent(body)
    // Static pages re-render with the new content on their next request
    revalidatePath("/", "layout")
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save content" },
      { status: 500 }
    )
  }
}
