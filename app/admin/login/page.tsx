"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next") || "/admin"
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError("")
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    setBusy(false)
    if (!res.ok) return setError(data.error || "Login failed.")
    router.replace(next)
    router.refresh()
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-[#e6e4df] bg-white p-8 shadow-sm">
        <span className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-[#ff5b1f] text-sm font-bold text-white shadow-sm">
          SC
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-[#111111]">Admin access</h1>
        <p className="mt-1 text-xs text-[#6b6b6b]">Enter the admin password to manage the portfolio.</p>

        <label htmlFor="password" className="mt-6 block text-xs font-semibold text-[#111111]">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-[#e6e4df] bg-[#fafaf7] px-3.5 py-2.5 text-sm text-[#111111] transition-colors focus:border-[#111111] focus:bg-white focus:outline-none"
        />
        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 flex w-full items-center justify-center rounded-full bg-[#111111] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#333333] disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Enter dashboard →"}
        </button>
        <p className="mt-4 text-center text-[11px] text-[#6b6b6b]">
          Set <code className="rounded bg-[#f2f0eb] px-1">ADMIN_PASSWORD</code> in <code className="rounded bg-[#f2f0eb] px-1">.env.local</code>.
        </p>
      </form>
    </div>
  )
}
