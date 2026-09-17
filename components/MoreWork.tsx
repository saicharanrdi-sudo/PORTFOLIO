"use client"

import { useRef } from "react"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { useContent } from "./ContentProvider"

gsap.registerPlugin(ScrollTrigger, useGSAP)

const HREF = "/work"

/**
 * "View Other Works" call-to-action. Lives outside the pinned spiral so it can
 * never be caught inside the pin-spacer.
 */
export default function MoreWork() {
  const { work } = useContent()
  const OTHER_WORKS_COUNT = work.projects.filter((p) => !p.featured).length
  const rootRef = useRef<HTMLElement>(null)
  const linkRef = useRef<HTMLAnchorElement>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      const link = linkRef.current
      if (!root || !link) return
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      if (reduce) return

      // Reveal
      gsap.fromTo(
        root.querySelectorAll("[data-reveal]"),
        { autoAlpha: 0, y: 40 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: { trigger: root, start: "top 85%", once: true },
        },
      )

      // Magnetic pull on fine pointers only
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return
      const xTo = gsap.quickTo(link, "x", { duration: 0.5, ease: "power3.out" })
      const yTo = gsap.quickTo(link, "y", { duration: 0.5, ease: "power3.out" })
      const onMove = (e: MouseEvent) => {
        const r = link.getBoundingClientRect()
        xTo((e.clientX - (r.left + r.width / 2)) * 0.25)
        yTo((e.clientY - (r.top + r.height / 2)) * 0.35)
      }
      const onLeave = () => {
        xTo(0)
        yTo(0)
      }
      link.addEventListener("mousemove", onMove)
      link.addEventListener("mouseleave", onLeave)

      // Positions below the pinned gallery can shift once this mounts
      ScrollTrigger.refresh()

      return () => {
        link.removeEventListener("mousemove", onMove)
        link.removeEventListener("mouseleave", onLeave)
      }
    },
    { scope: rootRef },
  )

  return (
    <section
      ref={rootRef}
      className="flex flex-col items-center bg-bg px-6 pt-20 pb-28 text-center md:px-10 lg:px-14 lg:pt-[120px] lg:pb-[180px]"
      aria-label="More work"
    >
      <p data-reveal className="mb-8 text-[15px] text-muted">
        Want to see more?
      </p>

      <div data-reveal>
        <Link
          ref={linkRef}
          href={HREF}
          aria-label={`View ${OTHER_WORKS_COUNT} other works`}
          className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full border border-ink px-7 py-4 text-[15px] font-medium text-ink transition-[border-color] duration-500 hover:border-primary motion-reduce:transition-none"
        >
          {/* Orange fill wipes up from the bottom */}
          <span
            aria-hidden="true"
            className="absolute inset-0 translate-y-[101%] bg-primary transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 motion-reduce:transition-none"
          />
          <span className="relative z-10 transition-colors duration-300 group-hover:text-white">View Other Works</span>
          <span
            aria-hidden="true"
            className="relative z-10 rounded-full bg-peach px-2 py-0.5 text-[12px] font-medium text-ink tabular-nums transition-colors duration-300 group-hover:bg-white"
          >
            +{String(OTHER_WORKS_COUNT).padStart(2, "0")}
          </span>
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="relative z-10 transition-[transform,color] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5 group-hover:text-white"
          >
            <path d="M1 7h12M7.5 1.5 13 7l-5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </section>
  )
}
