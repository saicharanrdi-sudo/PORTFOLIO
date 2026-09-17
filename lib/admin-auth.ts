/**
 * Admin session helpers. Works in both the proxy (edge-compatible) and route
 * handlers, so it only uses Web Crypto.
 *
 * - ADMIN_PASSWORD set → password required everywhere.
 * - ADMIN_PASSWORD unset → open in development (with a banner), locked in production.
 */
export const SESSION_COOKIE = "admin_session"

export const adminPassword = () => process.env.ADMIN_PASSWORD?.trim() || ""
export const authDisabledInDev = () => !adminPassword() && process.env.NODE_ENV !== "production"

let cached: string | null = null

/** Opaque token derived from the password; changing the password invalidates all sessions. */
export async function sessionToken(): Promise<string> {
  if (cached) return cached
  const secret = adminPassword()
  if (!secret) return ""
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("portfolio-admin-session-v1"))
  cached = Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("")
  return cached
}

export async function isAuthorised(cookieValue: string | undefined): Promise<boolean> {
  if (authDisabledInDev()) return true
  const expected = await sessionToken()
  return !!expected && cookieValue === expected
}
