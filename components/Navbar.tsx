"use client"

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

export default function Navbar() {
  const pathname = usePathname()
  const { site } = useContent()
  const isActive = (href: string) => (href === "/" ? pathname === "/" : !href.includes("#") && pathname.startsWith(href))

  return (
    <header className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
      <nav
        aria-label="Primary"
        className="pointer-events-auto flex max-w-full items-center gap-5 overflow-x-auto rounded-full border border-line/70 bg-bg/85 px-5 py-2.5 shadow-[0_16px_48px_-16px_rgba(17,17,17,0.25)] backdrop-blur-md md:gap-7 md:px-6"
      >
        <Link href="/" className="hidden shrink-0 text-[15px] font-medium tracking-tight md:block">
          {site.name}
        </Link>

        <ul className="flex shrink-0 items-center gap-5 text-[15px] md:gap-7">
          {LINKS.map((link) => {
            const active = isActive(link.href)
            const mobileHidden = link.label === "About" || link.label === "Contact"
            return (
              <li key={link.href} className={mobileHidden ? "hidden md:block" : ""}>
                <HashLink
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className="relative inline-flex shrink-0 items-center gap-2 py-1 whitespace-nowrap after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-out hover:after:origin-left hover:after:scale-x-100 motion-reduce:after:transition-none"
                >
                  {active && <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />}
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
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-ink px-4 py-2 text-[14px] font-medium whitespace-nowrap transition-colors duration-300 hover:bg-ink hover:text-white motion-reduce:transition-none"
            >
              Resume <span aria-hidden="true">↓</span>
            </a>
          </li>
          )}
        </ul>
      </nav>
    </header>
  )
}
