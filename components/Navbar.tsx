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
    <header className="fixed inset-x-0 top-0 z-40 border-b border-line/60 bg-bg/80 backdrop-blur-md">
      <nav aria-label="Primary" className="flex h-[72px] items-center justify-between px-6 md:px-10 lg:px-14">
        <Link href="/" className="text-[15px] font-medium tracking-tight">
          {site.name}
        </Link>

        <ul className="flex items-center gap-6 text-[15px] md:gap-8">
          {LINKS.map((link) => {
            const active = isActive(link.href)
            const mobileHidden = link.label === "Home" || link.label === "About" || link.label === "Contact"
            return (
              <li key={link.href} className={mobileHidden ? "hidden md:block" : ""}>
                <HashLink
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className="relative inline-flex items-center gap-2 py-1 after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-out hover:after:origin-left hover:after:scale-x-100 motion-reduce:after:transition-none"
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
              className="inline-flex items-center gap-1.5 rounded-full border border-ink px-4 py-2 text-[14px] font-medium transition-colors duration-300 hover:bg-ink hover:text-white motion-reduce:transition-none"
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
