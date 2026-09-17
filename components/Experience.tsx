"use client"

import { useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"
import { splitLines, HIDDEN_Y } from "@/lib/split"
import { useContent } from "./ContentProvider"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)

export default function Experience() {
  const { experience, site } = useContent()
  const rootRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      const heading = headingRef.current
      if (!root || !heading) return
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

      // Heading lines rise inside masks
      let split: SplitText | undefined
      document.fonts.ready.then(() => {
        split = splitLines(heading)
        gsap.from(split.lines, {
          yPercent: HIDDEN_Y,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: { trigger: heading, start: "top 82%", once: true },
          onComplete: () => split?.revert(),
        })
      })

      gsap.fromTo(
        root.querySelectorAll("[data-head]"),
        { autoAlpha: 0, y: 16 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: { trigger: heading, start: "top 82%", once: true },
        },
      )

      // Rows: border draws left → right, then the cells fade up in sequence
      root.querySelectorAll<HTMLElement>("[data-row]").forEach((row) => {
        gsap
          .timeline({ scrollTrigger: { trigger: row, start: "top 85%", once: true } })
          .fromTo(
            row.querySelectorAll("[data-line]"),
            { scaleX: 0, transformOrigin: "left center" },
            { scaleX: 1, duration: 0.9, ease: "power3.inOut" },
          )
          .fromTo(
            row.querySelectorAll("[data-cell]"),
            { autoAlpha: 0, y: 30 },
            { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.12 },
            "-=0.5",
          )
      })

      // Education
      gsap.fromTo(
        root.querySelectorAll("[data-block]"),
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: { trigger: "[data-blocks]", start: "top 85%", once: true },
        },
      )

      return () => split?.revert()
    },
    { scope: rootRef },
  )

  return (
    <section
      id="experience"
      ref={rootRef}
      className="bg-bg px-6 py-20 md:px-10 lg:px-14 lg:py-[120px]"
      aria-labelledby="experience-heading"
    >
      {/* Header */}
      <div className="grid grid-cols-12 items-end gap-x-6 gap-y-8">
        <div className="col-span-12 lg:col-span-8">
          <p
            data-head
            className="mb-6 flex items-center gap-3 text-[13px] font-medium tracking-[0.08em] uppercase"
          >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
            Experience
          </p>
          <h2
            id="experience-heading"
            ref={headingRef}
            className="max-w-[18ch] text-[clamp(32px,3.6vw,56px)] leading-[1.08] font-medium tracking-[-0.03em]"
          >
            {experience.heading}
          </h2>
        </div>
        {site.resumeUrl && (
        <div data-head className="col-span-12 lg:col-span-4 lg:justify-self-end">
          <a
            href={site.resumeUrl}
            download={`${site.name.replace(/\s+/g, "-")}-Resume.pdf`}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-ink px-6 py-3.5 text-[15px] font-medium before:absolute before:inset-0 before:origin-bottom before:scale-y-0 before:bg-primary before:transition-transform before:duration-500 before:ease-out hover:border-primary hover:before:scale-y-100 motion-reduce:before:transition-none"
          >
            <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
              Download Resume
            </span>
            <span
              aria-hidden="true"
              className="relative z-10 transition-[color,transform] duration-300 group-hover:translate-y-0.5 group-hover:text-white"
            >
              ↓
            </span>
          </a>
        </div>
        )}
      </div>

      {/* Roles */}
      <ol className="mt-16 md:mt-20">
        {experience.roles.map((role, i) => {
          const current = role.to === "Present"
          const last = i === experience.roles.length - 1
          return (
            <li key={role.title + role.from} data-row className="group relative">
              {/* Borders (drawn in by GSAP) */}
              <span data-line aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-line" />
              {last && <span data-line aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-line" />}

              {/* Hover wipe */}
              <span
                aria-hidden="true"
                className="absolute inset-0 origin-left scale-x-0 bg-peach transition-transform duration-500 ease-out group-hover:scale-x-100 motion-reduce:transition-none"
              />

              <div className="relative z-10 grid grid-cols-12 items-start gap-x-6 gap-y-3 py-10 md:py-12">
                <p data-cell className="col-span-12 flex items-center gap-2.5 text-[15px] text-muted md:col-span-3 md:pt-2">
                  <span>
                    {role.from} &ndash; {role.to}
                  </span>
                  {current && (
                    <span className="relative flex size-2" aria-label="Current role">
                      <span aria-hidden="true" className="absolute inset-0 animate-pulse-soft rounded-full bg-primary" />
                      <span className="relative size-2 rounded-full bg-primary" />
                    </span>
                  )}
                </p>

                <div className="col-span-12 md:col-span-4">
                  <h3
                    data-cell
                    className="text-[clamp(24px,2.3vw,32px)] leading-tight font-medium tracking-[-0.02em] transition-transform duration-500 ease-out group-hover:translate-x-3 motion-reduce:transition-none"
                  >
                    {role.title}
                  </h3>
                  <p data-cell className="mt-3 max-w-[520px] text-[16px] leading-[1.6] text-muted">
                    {role.text}
                  </p>
                </div>

                <p
                  data-cell
                  className="col-span-12 text-[17px] text-muted transition-transform duration-500 ease-out group-hover:translate-x-3 md:col-span-3 md:pt-1 motion-reduce:transition-none"
                >
                  {role.company}
                </p>

                <span
                  data-cell
                  aria-hidden="true"
                  className="col-span-12 flex items-start md:col-span-2 md:justify-end md:pt-1"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 22 22"
                    fill="none"
                    className="text-ink transition-[transform,color] duration-500 ease-out group-hover:-rotate-45 group-hover:text-primary motion-reduce:transition-none"
                  >
                    <path d="M3 11h16M12 4l7 7-7 7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </li>
          )
        })}
      </ol>

      {/* Education: one line per entry, label and details on a single row */}
      <div data-blocks className="mt-10 md:mt-12">
        {experience.education.map((e) => (
          <div
            key={e.name}
            data-block
            className="flex flex-wrap items-baseline gap-x-8 gap-y-2 border-b border-line py-6"
          >
            <span className="w-full text-[12px] font-medium tracking-[0.08em] text-muted uppercase sm:w-auto sm:min-w-[140px]">
              Education
            </span>
            <span className="text-[17px] font-medium">{e.name}</span>
            <span className="text-[15px] text-muted">{e.place}</span>
            <span className="ml-auto text-[15px] text-muted tabular-nums">{e.year}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
