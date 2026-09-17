/**
 * One-time migration script: uploads local content/site.json to the deployed Blob store.
 *
 * Usage:
 *   node scripts/upload-content.mjs <your-deployed-url> <admin-password>
 *
 * Example:
 *   node scripts/upload-content.mjs https://your-portfolio.vercel.app saicharanreddy
 */

import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

const [, , siteUrl, password] = process.argv

if (!siteUrl || !password) {
  console.error("Usage: node scripts/upload-content.mjs <site-url> <admin-password>")
  console.error("Example: node scripts/upload-content.mjs https://my-portfolio.vercel.app saicharanreddy")
  process.exit(1)
}

const base = siteUrl.replace(/\/$/, "")
const contentPath = resolve(__dirname, "../content/site.json")

console.log("📂 Reading local content/site.json...")
const content = JSON.parse(readFileSync(contentPath, "utf8"))

// Step 1: Login to get session cookie
console.log("🔐 Logging in to admin...")
const loginRes = await fetch(`${base}/api/admin/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ password }),
})

if (!loginRes.ok) {
  const err = await loginRes.json().catch(() => ({}))
  console.error("❌ Login failed:", err.error || loginRes.status)
  process.exit(1)
}

// Extract session cookie
const setCookie = loginRes.headers.get("set-cookie") || ""
const cookieMatch = setCookie.match(/admin_session=([^;]+)/)
if (!cookieMatch) {
  console.error("❌ No session cookie received. Check your password.")
  process.exit(1)
}
const sessionCookie = `admin_session=${cookieMatch[1]}`
console.log("✅ Logged in successfully")

// Step 2: Upload content — the server handles public/private blob detection automatically
console.log("☁️  Uploading content to Blob store...")
const saveRes = await fetch(`${base}/api/admin/content`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Cookie: sessionCookie,
  },
  body: JSON.stringify(content),
})

const result = await saveRes.json().catch(() => ({}))

if (!saveRes.ok) {
  console.error("❌ Upload failed:", result.error || saveRes.status)
  process.exit(1)
}

console.log("✅ Content uploaded successfully to Blob store!")
console.log("🌐 Your live site will reflect the content shortly.")
