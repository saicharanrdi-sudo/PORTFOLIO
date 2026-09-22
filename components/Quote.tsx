"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { blur } from "@/lib/perf"
import { useContent } from "./ContentProvider"

gsap.registerPlugin(ScrollTrigger)

const INK = "#111111"
const PRIMARY = "#ff5b1f"
const GHOST = "#e6e4df"

export default function Quote() {
  const { quote, site } = useContent()
  const accent = new Set(quote.highlights.map((h) => h.toLowerCase()))
  const WORDS = quote.text.split(" ").map((word) => ({
    word,
    accent: accent.has(word.replace(/[^a-z]/gi, "").toLowerCase()),
  }))
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const words = Array.from(root.querySelectorAll<HTMLElement>("[data-word]"))
    const sig = root.querySelector<HTMLElement>("[data-sig]")!
    const bar = root.querySelector<HTMLElement>("[data-bar]")!
    const finalColor = (el: HTMLElement) => (el.dataset.accent === "true" ? PRIMARY : INK)

    const mm = gsap.matchMedia()

    // Reduced motion: full quote, no pin, no progress line
    mm.add("(prefers-reduced-motion: reduce)", () => {
      words.forEach((el) => gsap.set(el, { color: finalColor(el) }))
      gsap.set(bar, { autoAlpha: 0 })
    })

    mm.add(
      {
        desktop: "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
        mobile: "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
      },
      (ctx) => {
        const { mobile } = ctx.conditions as { mobile: boolean }
        // Blur is costly on low-end GPUs, so mobile gets the same reveal without it
        const blurFrom = mobile ? "none" : blur(4)
        const blurTo = blurFrom === "none" ? "none" : "blur(0px)"

        gsap.set(bar, { transformOrigin: "left center" })

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: mobile ? "+=100%" : "+=120%",
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            refreshPriority: 2,
          },
        })

        // One word after another in reading order; each word's own
        // transition overlaps the next few so the sweep feels continuous
        const step = 1
        const dur = 3
        words.forEach((el, i) => {
          tl.fromTo(
            el,
            { color: GHOST, y: 8, filter: blurFrom },
            { color: finalColor(el), y: 0, filter: blurTo, duration: dur, immediateRender: true },
            i * step,
          )
        })

        const wordsEnd = (words.length - 1) * step + dur
        tl.fromTo(sig, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 4, immediateRender: true }, wordsEnd - 1)
        tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: wordsEnd, immediateRender: true }, 0)
      },
    )

    // Font metrics change line wrapping, which changes the pinned height
    document.fonts.ready.then(() => ScrollTrigger.refresh())

    return () => mm.revert()
  }, [])

  return (
    <section
      id="approach"
      ref={rootRef}
      className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-bg px-6 py-24 text-center md:px-10 lg:px-14"
      aria-labelledby="approach-label"
    >
      {/* Opening quotation mark */}
      <span
        aria-hidden="true"
        className="pointer-events-none -mb-[0.35em] font-medium text-[clamp(120px,16vw,240px)] leading-none text-peach select-none"
      >
        &ldquo;
      </span>

      <p
        id="approach-label"
        className="mb-10 flex items-center gap-3 text-[13px] font-medium tracking-[0.08em] uppercase md:mb-14"
      >
        <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
        My Approach
      </p>

      <blockquote className="max-w-[1100px]">
        {/* Full sentence for assistive tech; the word spans below are presentational */}
        <p className="sr-only">{quote.text}</p>
        <p
          aria-hidden="true"
          className="text-[clamp(36px,5vw,80px)] leading-[1.15] font-medium tracking-[-0.02em]"
        >
          {WORDS.map(({ word, accent }, i) => (
            <span key={i}>
              <span
                data-word
                data-accent={accent}
                className="inline-block will-change-[transform,color,filter]"
              >
                {word}
              </span>
              {i < WORDS.length - 1 ? " " : null}
            </span>
          ))}
        </p>
      </blockquote>

      <p data-sig className="mt-10 text-[15px] text-muted md:mt-14">
        &mdash; {site.name}, {quote.signature}
      </p>

      {/* Progress line, fills with the reveal */}
      <div
        data-bar
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-primary will-change-transform"
      />
    </section>
  )
}
