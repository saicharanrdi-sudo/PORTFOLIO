"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"
import { splitLines, HIDDEN_Y } from "@/lib/split"
import Highlight from "./Highlight"
import { useContent } from "./ContentProvider"

gsap.registerPlugin(ScrollTrigger, SplitText)

export default function About() {
  const { about, site } = useContent()
  const rootRef = useRef<HTMLElement>(null)
  const statementRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const statement = statementRef.current
    if (!root || !statement) return

    const mm = gsap.matchMedia()

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(root.querySelectorAll("[data-reveal], [data-line], [data-stat-num]"), {
        clearProps: "all",
      })
      root.querySelectorAll<HTMLElement>("[data-stat-num]").forEach((el) => {
        el.textContent = `${el.dataset.value}${el.dataset.suffix ?? ""}`
      })
    })

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const reveal = (targets: gsap.TweenTarget, trigger: Element, vars: gsap.TweenVars = {}) =>
        gsap.fromTo(
          targets,
          { autoAlpha: 0, y: 40 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1.1,
            ease: "power3.out",
            ...vars,
            scrollTrigger: { trigger, start: "top 82%", once: true },
          },
        )

      // Label + statement lines
      const head = root.querySelector("[data-head]")!
      const split = splitLines(statement)
      gsap
        .timeline({
          scrollTrigger: { trigger: head, start: "top 78%", once: true },
          onComplete: () => split.revert(),
        })
        .fromTo(
          head.querySelector("[data-reveal]"),
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" },
        )
        .fromTo(
          split.lines,
          { yPercent: HIDDEN_Y },
          { yPercent: 0, duration: 1, ease: "power3.out", stagger: 0.1 },
          "-=0.6",
        )

      // Portrait: fade up while the image settles from a slight zoom
      const portrait = root.querySelector("[data-portrait]")
      if (portrait) {
        reveal(portrait, portrait, { duration: 1.3 })
        gsap.fromTo(
          portrait.firstElementChild,
          { scale: 1.12 },
          {
            scale: 1,
            duration: 1.6,
            ease: "power3.out",
            scrollTrigger: { trigger: portrait, start: "top 82%", once: true },
          },
        )
      }

      // Paragraph
      const body = root.querySelector("[data-body]")!
      reveal(body, body)

      // Dividers draw in from the left
      root.querySelectorAll("[data-line]").forEach((line) => {
        gsap.fromTo(
          line,
          { scaleX: 0, transformOrigin: "left center" },
          {
            scaleX: 1,
            duration: 1.2,
            ease: "power3.inOut",
            scrollTrigger: { trigger: line, start: "top 90%", once: true },
          },
        )
      })

      // Service columns
      const services = root.querySelector("[data-services]")!
      reveal(services.querySelectorAll("[data-reveal]"), services, { stagger: 0.1 })

      // Stats: fade in, numbers count up
      const stats = root.querySelector("[data-stats]")!
      reveal(stats.querySelectorAll("[data-reveal]"), stats, { stagger: 0.1 })
      stats.querySelectorAll<HTMLElement>("[data-stat-num]").forEach((el) => {
        const target = Number(el.dataset.value)
        const suffix = el.dataset.suffix ?? ""
        const counter = { v: 0 }
        gsap.to(counter, {
          v: target,
          duration: 1.6,
          ease: "power3.out",
          scrollTrigger: { trigger: stats, start: "top 82%", once: true },
          onUpdate: () => {
            el.textContent = `${Math.round(counter.v)}${suffix}`
          },
        })
      })

      return () => split.revert()
    })

    return () => mm.revert()
  }, [])

  return (
    <section
      id="about"
      ref={rootRef}
      className="px-6 py-24 md:px-10 md:py-32 lg:px-14 lg:py-40"
      aria-labelledby="about-label"
    >
      <div className="grid grid-cols-12 items-start gap-x-6 gap-y-12">
        {/* Label + statement */}
        <div data-head className="col-span-12 lg:col-span-7">
          <p
            id="about-label"
            data-reveal
            className="mb-8 flex items-center gap-3 text-[13px] font-medium tracking-[0.08em] uppercase"
          >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
            About
          </p>
          <p
            ref={statementRef}
            className="text-[clamp(30px,3.4vw,56px)] leading-[1.1] font-medium tracking-[-0.03em]"
          >
            <Highlight text={about.statement} word={about.highlight} />
          </p>
          <p
            data-body
            className="mt-10 max-w-[560px] text-[17px] leading-[1.6] text-muted md:mt-14 md:text-[18px]"
          >
            {about.paragraph}
          </p>
        </div>

        {/* Portrait: transparent cutout, sits directly on the page */}
        <div data-portrait className="col-span-12 sm:col-span-6 lg:col-span-4 lg:col-start-9">
          {about.portrait ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={about.portrait}
              alt={`Portrait of ${site.name}`}
              className="h-auto w-full select-none will-change-transform"
              draggable={false}
            />
          ) : null}
        </div>

      </div>

      {/* Services */}
      <div data-line className="mt-20 h-px w-full bg-line md:mt-28" />
      <div data-services className="grid grid-cols-12 gap-x-6 gap-y-10 py-14 md:py-20">
        <h2
          data-reveal
          className="col-span-12 text-[13px] font-medium tracking-[0.08em] text-muted uppercase lg:col-span-3"
        >
          What I do
        </h2>
        <ul className="col-span-12 grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-3 lg:col-span-9">
          {about.services.map((s) => (
            <li key={s.n} data-reveal>
              <span className="block text-[13px] font-medium tracking-[0.04em] text-muted">
                {s.n}
              </span>
              <h3 className="mt-4 text-[20px] leading-tight font-medium tracking-[-0.01em]">
                {s.title}
              </h3>
              <p className="mt-3 max-w-[30ch] text-[15px] leading-[1.55] text-muted">{s.text}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Stats */}
      <div data-line className="h-px w-full bg-line" />
      <ul
        data-stats
        className="grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0"
      >
        {about.stats.map((s) => (
          <li
            key={s.label}
            data-reveal
            className="py-10 sm:px-8 sm:py-14 sm:first:pl-0 sm:last:pr-0"
          >
            <span
              data-stat-num
              data-value={s.value}
              data-suffix={s.suffix}
              className="block text-[clamp(48px,4.4vw,64px)] leading-none font-medium tracking-[-0.03em] text-primary tabular-nums"
            >
              0{s.suffix}
            </span>
            <span className="mt-3 block text-[15px] text-muted">{s.label}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
