import type { Metadata } from "next"
import Link from "next/link"
import LogoutButton from "@/components/admin/LogoutButton"
import { authDisabledInDev } from "@/lib/admin-auth"

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
  return (
    <div className="min-h-screen bg-[#f8f8f5] text-[#111111] antialiased">
      {open && (
        <p className="bg-[#ffe8dd] px-4 py-2 text-center text-xs text-[#111111]">
          Admin is open because <code>ADMIN_PASSWORD</code> is not set. Add it to <code>.env.local</code> before deploying.
        </p>
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
