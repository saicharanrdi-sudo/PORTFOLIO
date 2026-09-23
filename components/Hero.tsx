"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { SplitText } from "gsap/SplitText"
import { splitLines, HIDDEN_Y } from "@/lib/split"
import MagneticButton from "./MagneticButton"
import UnderlineLink from "./UnderlineLink"
import Marquee from "./Marquee"
import Tetris from "./Tetris"
import Highlight from "./Highlight"
import { useContent } from "./ContentProvider"

gsap.registerPlugin(SplitText)

type Props = {
  /** Set to true when the preloader starts lifting; kicks off the intro. */
  play: boolean
}

export default function Hero({ play }: Props) {
  const { hero, site } = useContent()
  const rootRef = useRef<HTMLElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!play) return
    const root = rootRef.current
    const headline = headlineRef.current
    if (!root || !headline) return

    let cancelled = false
    let ctx: gsap.Context | undefined

    // Wait for the webfont so SplitText measures the final line breaks
    document.fonts.ready.then(() => {
      if (cancelled) return
      ctx = gsap.context(() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        if (reduce) return

        const split = splitLines(headline)

        const tl = gsap.timeline({
          delay: 0.3,
          // Restore the original markup once the intro is done so
          // later resizes reflow naturally
          onComplete: () => split.revert(),
        })
        tl.fromTo(
          split.lines,
          { yPercent: HIDDEN_Y },
          { yPercent: 0, duration: 0.8, ease: "power3.out", stagger: 0.1 },
        )
        tl.fromTo(
          "[data-reveal]",
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.07 },
          "-=0.55",
        )
      }, root)
    })

    return () => {
      cancelled = true
      ctx?.revert()
    }
  }, [play])

  return (
    <section ref={rootRef} className="relative flex min-h-svh flex-col">
      {/* Everything above the marquee line shares the Tetris backdrop */}
      <div className="relative flex flex-1 flex-col">
        {/* Ambient background: self-playing Tetris in the site palette, non-interactive */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
          <Tetris boardColor="rgba(17, 17, 17, 0)" colors={["#FF5B1F", "#E6E4DF"]} />
        </div>


      <div className="relative z-10 flex flex-1 items-center px-6 py-16 md:px-10 lg:px-14">
        <div className="grid w-full grid-cols-12 gap-x-6">
          <div className="col-span-12 xl:col-span-11">
            <p
              data-reveal
              className="mb-6 text-[13px] font-medium tracking-[0.08em] text-muted uppercase"
            >
              {hero.label}
            </p>

            <h1
              ref={headlineRef}
              className="max-w-[28ch] text-[clamp(48px,5.6vw,112px)] leading-[1.02] font-medium tracking-[-0.03em]"
            >
              <Highlight text={hero.headline} word={hero.highlight} />
            </h1>

            <p
              data-reveal
              className="mt-8 max-w-[46ch] text-[17px] leading-[1.55] text-muted md:text-[18px]"
            >
              {hero.support}
            </p>

            <div data-reveal className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
              <MagneticButton href="#work">View Work</MagneticButton>
              <UnderlineLink href="#contact" className="text-[15px] font-medium">
                Get in Touch
              </UnderlineLink>
            </div>

            {site.available && (
            <p data-reveal className="mt-12 flex items-center gap-3 text-[14px] text-muted">
              <span className="relative flex size-2">
                <span
                  aria-hidden="true"
                  className="absolute inset-0 animate-pulse-soft rounded-full bg-primary"
                />
                <span className="relative size-2 rounded-full bg-primary" />
              </span>
              {site.availableText}
            </p>
            )}
          </div>
        </div>
      </div>

      </div>

      <div className="border-t border-line pb-[84px]">
        <Marquee />
      </div>
    </section>
  )
}
