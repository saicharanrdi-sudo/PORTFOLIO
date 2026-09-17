"use client"

import { useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"
import { splitLines, HIDDEN_Y } from "@/lib/split"
import { useContent } from "./ContentProvider"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)

/** Two-letter monogram standing in for a logo. */
const monogram = (name: string) => name.replace(/[^a-z]/gi, "").slice(0, 2)

export default function Skills() {
  const { skills } = useContent()
  const rootRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      const heading = headingRef.current
      if (!root || !heading) return
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

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
        root.querySelector("[data-label]"),
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: heading, start: "top 82%", once: true } },
      )

      // Pills pop in per group
      root.querySelectorAll<HTMLElement>("[data-group]").forEach((group) => {
        gsap
          .timeline({ scrollTrigger: { trigger: group, start: "top 85%", once: true } })
          .fromTo(
            group.querySelector("[data-group-title]"),
            { autoAlpha: 0, y: 16 },
            { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" },
          )
          .fromTo(
            group.querySelectorAll("[data-pill]"),
            { autoAlpha: 0, scale: 0.85, y: 20 },
            { autoAlpha: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.6)", stagger: 0.04 },
            "-=0.3",
          )
      })

      // Tool tiles fade up in a grid stagger
      const tools = root.querySelector("[data-tools]")!
      gsap
        .timeline({ scrollTrigger: { trigger: tools, start: "top 85%", once: true } })
        .fromTo(
          tools.querySelector("[data-group-title]"),
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" },
        )
        .fromTo(
          tools.querySelectorAll("[data-tile]"),
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: { from: "start", amount: 0.6 } },
          "-=0.3",
        )

      return () => split?.revert()
    },
    { scope: rootRef },
  )

  return (
    <section
      id="skills"
      ref={rootRef}
      className="bg-bg px-6 py-20 md:px-10 lg:px-14 lg:py-[120px]"
      aria-labelledby="skills-heading"
    >
      <p data-label className="mb-6 flex items-center gap-3 text-[13px] font-medium tracking-[0.08em] uppercase">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
        Skills &amp; Tools
      </p>
      <h2
        id="skills-heading"
        ref={headingRef}
        className="max-w-[18ch] text-[clamp(32px,3.6vw,56px)] leading-[1.08] font-medium tracking-[-0.03em]"
      >
        {skills.heading}
      </h2>

      {/* Design / Development */}
      <div className="mt-16 grid grid-cols-12 gap-x-6 gap-y-14 md:mt-20">
        {skills.groups.map((group, gi) => (
          <div key={group.title} data-group className="col-span-12 lg:col-span-6">
            <h3 data-group-title className="mb-7 flex items-baseline gap-3 text-[15px] font-medium">
              <span className="text-[13px] text-primary tabular-nums">{String(gi + 1).padStart(2, "0")}</span>
              {group.title}
            </h3>
            <ul className="flex flex-wrap gap-3" aria-label={`${group.title} skills`}>
              {group.items.map((item) => (
                <li
                  key={item}
                  data-pill
                  className="rounded-full border border-line bg-white px-[22px] py-3 text-[16px] transition-[background-color,color,border-color,transform] duration-300 ease-out select-none hover:-translate-y-[3px] hover:border-primary hover:bg-primary hover:text-white active:bg-peach motion-reduce:transition-none"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Tools */}
      <div data-tools className="mt-20 md:mt-24">
        <h3 data-group-title className="mb-7 flex items-baseline gap-3 text-[15px] font-medium">
          <span className="text-[13px] text-primary tabular-nums">{String(skills.groups.length + 1).padStart(2, "0")}</span>
          Tools
        </h3>
        <ul className="tiles grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5" aria-label="Tools">
          {skills.tools.map((tool) => (
            <li
              key={tool.name}
              data-tile
              className="group flex h-[140px] flex-col items-center justify-center gap-3 rounded-[20px] border border-line bg-white transition-[transform,border-color,box-shadow,opacity] duration-300 ease-out select-none hover:-translate-y-2 hover:border-primary hover:shadow-[0_20px_50px_-20px_rgba(17,17,17,0.18)] active:bg-peach motion-reduce:transition-none"
            >
              {tool.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tool.icon}
                  alt=""
                  aria-hidden="true"
                  className="size-10 object-contain transition-transform duration-300 ease-out group-hover:scale-110"
                  draggable={false}
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex size-9 items-center justify-center rounded-full bg-surface text-[12px] font-medium tracking-[0.02em] text-muted transition-colors duration-300 group-hover:bg-peach group-hover:text-ink"
                >
                  {monogram(tool.name)}
                </span>
              )}
              <span className="text-[15px] font-medium transition-transform duration-300 ease-out group-hover:scale-105">
                {tool.name}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
