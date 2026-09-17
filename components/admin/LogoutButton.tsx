"use client"

import { useRouter } from "next/navigation"

export default function LogoutButton() {
  const router = useRouter()
  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" })
    router.replace("/admin/login")
    router.refresh()
  }
  return (
    <button
      type="button"
      onClick={logout}
      className="rounded-full px-3 py-1.5 text-xs font-medium text-[#6b6b6b] transition-colors hover:text-[#111111]"
    >
      Log out
    </button>
  )
}
