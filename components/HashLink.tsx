"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { scrollTo } from "@/lib/lenis"

type Props = React.ComponentProps<typeof Link> & { href: string }

/**
 * A Next Link that, when its target hash is on the current page,
 * smooth-scrolls there with Lenis instead of navigating.
 */
export default function HashLink({ href, onClick, children, ...rest }: Props) {
  const pathname = usePathname()

  const handle = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented) return
    const [path, hash] = href.split("#")
    if (hash === undefined) return
    const samePage = path === "" || path === pathname
    if (!samePage) return
    const el = document.getElementById(hash)
    if (!el) return
    e.preventDefault()
    scrollTo(el, { offset: -80 })
    window.history.replaceState(null, "", `#${hash}`)
  }

  return (
    <Link href={href} onClick={handle} {...rest}>
      {children}
    </Link>
  )
}
