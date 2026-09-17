"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"

type Props = {
  children: React.ReactNode
  className?: string
  /** Renders an <a> when present, otherwise a <button>. */
  href?: string
  target?: string
  rel?: string
  onClick?: () => void
  ref?: React.Ref<HTMLElement>
} & Pick<React.AriaAttributes, "aria-haspopup" | "aria-expanded" | "aria-controls">

/**
 * Primary CTA. On fine-pointer devices the whole element eases a little
 * toward the cursor while hovered, and the arrow slides right.
 */
export default function MagneticButton({ children, className = "", href, target, rel, onClick, ref, ...aria }: Props) {
  const innerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = innerRef.current
    if (!el) return
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const xTo = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3.out" })
    const yTo = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3.out" })

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      xTo((e.clientX - (r.left + r.width / 2)) * 0.28)
      yTo((e.clientY - (r.top + r.height / 2)) * 0.28)
    }
    const onLeave = () => {
      xTo(0)
      yTo(0)
    }

    el.addEventListener("mousemove", onMove)
    el.addEventListener("mouseleave", onLeave)
    return () => {
      el.removeEventListener("mousemove", onMove)
      el.removeEventListener("mouseleave", onLeave)
    }
  }, [])

  const setRef = (node: HTMLElement | null) => {
    innerRef.current = node
    if (typeof ref === "function") ref(node)
    else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node
  }

  const classes = `group inline-flex items-center gap-2.5 rounded-full bg-primary px-6 py-3.5 text-[15px] font-medium text-white transition-colors duration-300 hover:bg-primary-hover ${className}`
  const inner = (
    <>
      <span>{children}</span>
      <svg
        aria-hidden="true"
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        className="transition-transform duration-300 ease-out group-hover:translate-x-1"
      >
        <path d="M1 7h12M7.5 1.5 13 7l-5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </>
  )

  if (href) {
    return (
      <a ref={setRef} href={href} target={target} rel={rel} onClick={onClick} className={classes} {...aria}>
        {inner}
      </a>
    )
  }
  return (
    <button ref={setRef} type="button" onClick={onClick} className={classes} {...aria}>
      {inner}
    </button>
  )
}
