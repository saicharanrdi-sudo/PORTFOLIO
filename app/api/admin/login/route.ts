import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { SESSION_COOKIE, adminPassword, authDisabledInDev, sessionToken } from "@/lib/admin-auth"

export async function POST(request: Request) {
  const { password } = (await request.json().catch(() => ({}))) as { password?: string }
  const expected = adminPassword()

  if (!expected) {
    if (authDisabledInDev()) return NextResponse.json({ ok: true, open: true })
    return NextResponse.json({ error: "ADMIN_PASSWORD is not configured on the server." }, { status: 500 })
  }
  if (!password || password !== expected) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 })
  }

  const store = await cookies()
  store.set(SESSION_COOKIE, await sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  })
  return NextResponse.json({ ok: true })
}
