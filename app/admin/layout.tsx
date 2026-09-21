import type { Metadata } from "next"
import Link from "next/link"
import LogoutButton from "@/components/admin/LogoutButton"
import { authDisabledInDev } from "@/lib/admin-auth"
import { usingBlob } from "@/lib/storage"

export const metadata: Metadata = {
  title: "CMS Admin — Sai Charan Reddy Portfolio",
  description: "Content management dashboard for portfolio",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const open = authDisabledInDev()
  const hasBlob = usingBlob()
  const isProd = process.env.NODE_ENV === "production"
  const readOnlyInProd = !hasBlob && isProd

  return (
    <div className="min-h-screen bg-[#f8f8f5] text-[#111111] antialiased">
      {open && (
        <p className="bg-[#ffe8dd] px-4 py-2 text-center text-xs text-[#111111]">
          Admin is open because <code>ADMIN_PASSWORD</code> is not set. Add it to <code>.env.local</code> before deploying.
        </p>
      )}
      {readOnlyInProd && (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-center text-xs text-amber-900 font-medium leading-relaxed">
          ⚠️ <strong>Action Required on Vercel:</strong> Saving changes and uploading files are currently disabled because the server filesystem is read-only.
          <span className="block sm:inline sm:ml-1">
            To enable updates, open your project in the{" "}
            <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-amber-950">
              Vercel Dashboard
            </a>{" "}
            → go to <strong>Storage</strong> → create / connect a <strong>Blob store</strong> → redeploy.
          </span>
        </div>
      )}
      <header className="sticky top-0 z-30 border-b border-[#e6e4df] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2 text-base font-semibold tracking-tight">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#ff5b1f] text-xs font-bold text-white shadow-sm">
                SC
              </span>
              <span>Portfolio CMS</span>
            </Link>
            <span className="rounded-full bg-[#ffe8dd] px-2.5 py-0.5 text-xs font-medium text-[#ff5b1f]">
              Admin
            </span>
            {hasBlob ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Blob Storage Active
              </span>
            ) : (
              <span
                className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                  isProd
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-neutral-100 text-neutral-600 border-neutral-200"
                }`}
              >
                <span className={`size-1.5 rounded-full ${isProd ? "bg-amber-500" : "bg-neutral-400"}`} />
                {isProd ? "Storage: Read-Only" : "Local Disk"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#e6e4df] bg-white px-3.5 py-1.5 font-medium transition-colors hover:border-[#111111] hover:bg-[#111111] hover:text-white"
            >
              <span>View Site</span>
              <span aria-hidden="true">↗</span>
            </Link>
            {!open && <LogoutButton />}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
