import { NextResponse, type NextRequest } from "next/server"
import { SESSION_COOKIE, isAuthorised } from "@/lib/admin-auth"

const PUBLIC = ["/admin/login", "/api/admin/login"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next()

  const ok = await isAuthorised(request.cookies.get(SESSION_COOKIE)?.value)
  if (ok) return NextResponse.next()

  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const login = new URL("/admin/login", request.url)
  login.searchParams.set("next", pathname)
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}
