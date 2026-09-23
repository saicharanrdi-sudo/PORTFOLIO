"use client"

import { useMemo, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { FILTERS, type Filter } from "@/data/projects"
import { useContent } from "../ContentProvider"
import ProjectRow from "./ProjectRow"
import { HIDDEN_Y } from "@/lib/split"
import BookCallButton from "../BookCall"

gsap.registerPlugin(ScrollTrigger, useGSAP)

const STICKY_BASE = 96
const STICKY_STEP = 12
const MAX_STEPS = 4
const stickyTop = (i: number) => STICKY_BASE + Math.min(i, MAX_STEPS) * STICKY_STEP

const pad = (n: number) => String(n).padStart(2, "0")

export default function WorkGallery() {
  const { work, site } = useContent()
  const PROJECTS = work.projects
  const behance = site.socials.find((s) => /behance/i.test(s.label) || /behance\.net/i.test(s.href))?.href
  const rootRef = useRef<HTMLElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)
  const [filter, setFilter] = useState<Filter>("All")

  const visible = useMemo(
    () => (filter === "All" ? PROJECTS : PROJECTS.filter((p) => p.filters.includes(filter))),
    [filter, PROJECTS],
  )
  const n = visible.length

  // Intro: once on load
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      gsap.fromTo(
        "[data-intro]",
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, delay: 0.15, force3D: true },
      )
    },
    { scope: rootRef },
  )

  // Stack: rebuilt whenever the filter changes
  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-row]"))
      const stack = root.querySelector<HTMLElement>("[data-stack]")!
      const pill = root.querySelector<HTMLElement>("[data-pill]")!
      const bar = root.querySelector<HTMLElement>("[data-bar]")!
      const mm = gsap.matchMedia()

      // Declared before any ScrollTrigger is created: onEnter can fire synchronously
      const setCounter = (i: number) => {
        if (counterRef.current) counterRef.current.textContent = pad(i + 1)
        gsap.to(bar, { scaleX: (i + 1) / Math.max(n, 1), duration: 0.5, ease: "power3.out", overwrite: true })
      }

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(pill, { autoAlpha: 0 })
      })

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(pill, { xPercent: -50, autoAlpha: 0, y: 12 })
        gsap.set(bar, { transformOrigin: "left center", scaleX: 1 / Math.max(n, 1) })

        rows.forEach((row, i) => {
          const card = row.querySelector<HTMLElement>("[data-card]")!
          const img = row.querySelector<HTMLElement>("[data-img]")!
          const shade = row.querySelector<HTMLElement>("[data-shade]")!
          const lines = row.querySelectorAll<HTMLElement>("[data-line]")

          // Arriving: image settles as the row travels up to its sticky spot
          gsap.fromTo(
            img,
            { scale: 1.18, yPercent: -4, transformOrigin: "center center" },
            {
              scale: 1,
              yPercent: 0,
              ease: "none",
              force3D: true,
              scrollTrigger: { trigger: row, start: "top bottom", end: `top ${stickyTop(i)}px`, scrub: true },
            },
          )

          // Text lines rise inside their masks
          gsap.fromTo(
            lines,
            { yPercent: HIDDEN_Y },
            {
              yPercent: 0,
              duration: 1,
              ease: "expo.out",
              stagger: 0.06,
              force3D: true,
              scrollTrigger: { trigger: row, start: "top 75%", once: true },
            },
          )

          // Counter follows the row that has reached its resting spot
          ScrollTrigger.create({
            trigger: row,
            start: `top ${stickyTop(i) + 1}px`,
            onEnter: () => setCounter(i),
            onLeaveBack: () => setCounter(Math.max(0, i - 1)),
          })

          // Receding: the next row's approach scales this card down and shades it
          const next = rows[i + 1]
          if (!next) return
          gsap
            .timeline({
              scrollTrigger: {
                trigger: next,
                start: "top bottom",
                end: `top ${stickyTop(i + 1)}px`,
                scrub: true,
              },
            })
            .fromTo(card, { scale: 1, transformOrigin: "center top" }, { scale: 0.9, ease: "none", force3D: true }, 0)
            .fromTo(shade, { autoAlpha: 0 }, { autoAlpha: 0.22, ease: "none" }, 0)
        })

        // Floating pill: only while the stack is on screen
        ScrollTrigger.create({
          trigger: stack,
          start: "top 60%",
          end: "bottom 40%",
          onToggle: ({ isActive }) =>
            gsap.to(pill, { autoAlpha: isActive ? 1 : 0, y: isActive ? 0 : 12, duration: 0.4, ease: "power3.out", overwrite: true }),
        })
      })

      setCounter(0)
      ScrollTrigger.refresh()
      return () => mm.revert()
    },
    { scope: rootRef, dependencies: [filter], revertOnUpdate: true },
  )

  return (
    <main ref={rootRef} className="bg-bg">
      {/* Header */}
      <section className="px-6 pt-20 pb-16 md:px-10 md:pt-28 lg:px-14 lg:pb-20" aria-labelledby="work-title">
        <p data-intro className="mb-6 flex items-center gap-3 text-[13px] font-medium tracking-[0.08em] uppercase">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
          Selected Work
        </p>
        <h1
          id="work-title"
          data-intro
          className="max-w-[14ch] text-[clamp(40px,6vw,104px)] leading-[1.02] font-medium tracking-[-0.03em]"
        >
          {work.heading}
        </h1>
        <p data-intro className="mt-8 max-w-[52ch] text-[17px] leading-[1.6] text-muted md:text-[18px]">
          {work.intro}
        </p>

        <div data-intro className="mt-12 flex flex-wrap items-center justify-between gap-x-8 gap-y-5">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter projects">
            {FILTERS.map((f) => {
              const active = f === filter
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  aria-pressed={active}
                  className={`rounded-full border px-4 py-2 text-[14px] font-medium transition-[background-color,color,border-color] duration-300 motion-reduce:transition-none ${
                    active ? "border-primary bg-primary text-white" : "border-line bg-white text-ink hover:border-ink"
                  }`}
                >
                  {f}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-6">
            <p className="text-[15px] text-muted tabular-nums" aria-live="polite">
              <span className="text-ink">{pad(n)}</span> {n === 1 ? "project" : "projects"}
            </p>
            {behance && (
              <a
                href={behance}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View my work on Behance (opens in a new tab)"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-ink px-5 py-2.5 text-[14px] font-medium before:absolute before:inset-0 before:origin-bottom before:scale-y-0 before:bg-primary before:transition-transform before:duration-500 before:ease-out hover:border-primary hover:before:scale-y-100 motion-reduce:before:transition-none"
              >
                <span className="relative z-10 transition-colors duration-300 group-hover:text-white">View Behance</span>
                <span
                  aria-hidden="true"
                  className="relative z-10 inline-block transition-[transform,color] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white"
                >
                  ↗
                </span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Stack */}
      <section data-stack className="px-6 md:px-10 lg:px-14" aria-label="Projects">
        {visible.map((project, i) => (
          <ProjectRow
            key={`${filter}-${project.slug}`}
            project={project}
            index={i}
            total={n}
            top={stickyTop(i)}
            isLast={i === n - 1}
          />
        ))}
      </section>

      {/* Floating counter */}
      <div
        data-pill
        aria-hidden="true"
        className="pointer-events-none fixed bottom-24 left-1/2 z-30 flex items-center gap-3 rounded-full border border-line bg-bg/95 py-2.5 pr-4 pl-4 text-[13px] font-medium tabular-nums will-change-[transform,opacity]"
      >
        <span>
          <span ref={counterRef} className="text-primary">
            01
          </span>
          <span className="text-muted"> / {pad(n)}</span>
        </span>
        <span className="h-px w-16 bg-line">
          <span data-bar className="block h-full w-full bg-primary will-change-transform" />
        </span>
      </div>

      {/* CTA */}
      <section className="px-6 pt-[28vh] pb-[140px] text-center md:px-10 lg:px-14 lg:pb-[180px]">
        <p className="mb-6 flex items-center justify-center gap-3 text-[13px] font-medium tracking-[0.08em] uppercase">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
          Next
        </p>
        <h2 className="mx-auto max-w-[14ch] text-[clamp(32px,4.2vw,64px)] leading-[1.05] font-medium tracking-[-0.03em]">
          Have a project in mind?
        </h2>
        <div className="mt-10 flex justify-center">
          <BookCallButton />
        </div>
      </section>
    </main>
  )
}
