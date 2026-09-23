"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import HashLink from "./HashLink"
import { useContent } from "./ContentProvider"

const LINKS = [
  { label: "Home", href: "/" },
  { label: "Work", href: "/work" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "#contact" },
]

/** Ignore tiny scroll jitter so the bar doesn't flicker. */
const THRESHOLD = 8
/** Always stay open near the top of the page. */
const TOP_ZONE = 120

export default function Navbar() {
  const pathname = usePathname()
  const { site } = useContent()
  const [collapsed, setCollapsed] = useState(false)
  const lockedOpen = useRef(false)

  const isActive = (href: string) => (href === "/" ? pathname === "/" : !href.includes("#") && pathname.startsWith(href))

  // Collapses into the name on the way down, reopens on the way up
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let last = window.scrollY
    let frame = 0

    const read = () => {
      frame = 0
      const y = window.scrollY
      const delta = y - last
      if (Math.abs(delta) < THRESHOLD) return
      last = y
      if (lockedOpen.current) return
      setCollapsed(y > TOP_ZONE && delta > 0)
    }
    const onScroll = () => {
      frame ||= requestAnimationFrame(read)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  // Keyboard and hover always reveal the full bar
  const open = () => {
    lockedOpen.current = true
    setCollapsed(false)
  }
  const release = () => {
    lockedOpen.current = false
  }

  return (
    <header className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(18px,env(safe-area-inset-bottom))]">
      <nav
        aria-label="Primary"
        onMouseEnter={open}
        onMouseLeave={release}
        onFocusCapture={open}
        onBlurCapture={release}
        className="pointer-events-auto flex max-w-full items-center overflow-hidden rounded-full bg-primary py-3 pr-7 pl-7 text-white shadow-[0_18px_56px_-18px_rgba(255,91,31,0.55)] md:pr-8 md:pl-8"
      >
        <Link href="/" className="shrink-0 text-[15px] font-medium tracking-tight whitespace-nowrap">
          {site.name}
        </Link>

        {/* Collapses to zero width on the way down, springs back open on the way up */}
        <div
          className={`grid transition-[grid-template-columns,opacity] duration-500 ease-out motion-reduce:transition-none ${
            collapsed ? "grid-cols-[0fr] opacity-0" : "grid-cols-[1fr] opacity-100"
          }`}
        >
          <div className="overflow-hidden">
            <ul className="flex shrink-0 items-center gap-6 pl-6 text-[15px] md:gap-8 md:pl-8">
              {LINKS.map((link) => {
                const active = isActive(link.href)
                const mobileHidden = link.label === "About" || link.label === "Contact"
                return (
                  <li key={link.href} className={mobileHidden ? "hidden md:block" : ""}>
                    <HashLink
                      href={link.href}
                      tabIndex={collapsed ? -1 : undefined}
                      aria-current={active ? "page" : undefined}
                      className="relative inline-flex shrink-0 items-center gap-2 py-1 whitespace-nowrap after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-out hover:after:origin-left hover:after:scale-x-100 motion-reduce:after:transition-none"
                    >
                      {active && <span aria-hidden="true" className="size-1.5 rounded-full bg-white" />}
                      {link.label}
                    </HashLink>
                  </li>
                )
              })}
              {site.resumeUrl && (
                <li>
                  <a
                    href={site.resumeUrl}
                    download={`${site.name.replace(/\s+/g, "-")}-Resume.pdf`}
                    tabIndex={collapsed ? -1 : undefined}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/70 px-4 py-2 text-[14px] font-medium whitespace-nowrap transition-colors duration-300 hover:bg-white hover:text-primary motion-reduce:transition-none"
                  >
                    Resume <span aria-hidden="true">↓</span>
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  )
}
