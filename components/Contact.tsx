"use client"

import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"
import { splitLines, HIDDEN_Y } from "@/lib/split"
import { useGSAP } from "@gsap/react"
import UnderlineLink, { underlineClass } from "./UnderlineLink"
import HashLink from "./HashLink"
import PredictiveArc from "./PredictiveArc"
import BookCallButton from "./BookCall"
import Highlight from "./Highlight"
import { useContent } from "./ContentProvider"
import { scrollTo } from "@/lib/lenis"

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)

const NAV = [
  { label: "Work", href: "/work" },
  { label: "About", href: "/#about" },
  { label: "Process", href: "/#process" },
  { label: "Contact", href: "#contact" },
]

const YEAR = 2026

export default function Contact() {
  const { site, contact } = useContent()
  const NAME = site.name
  const EMAIL = site.email
  const rootRef = useRef<HTMLElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const nameRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  // Giant name: size the font so the letters span the full width, whatever the name is
  useEffect(() => {
    const el = nameRef.current
    if (!el) return
    const fit = () => {
      const parent = el.parentElement!
      el.style.fontSize = "100px"
      const size = Math.floor((100 * parent.clientWidth) / el.getBoundingClientRect().width)
      el.style.fontSize = `${size}px`
      // Crop the bottom ~quarter of the glyphs for the editorial cut-off
      parent.style.height = `${Math.round(size * 0.74)}px`
    }
    fit()
    document.fonts.ready.then(fit)
    // The 600 weight loads lazily on first use, so re-fit once it lands
    document.fonts.addEventListener("loadingdone", fit)
    const ro = new ResizeObserver(fit)
    ro.observe(el.parentElement!)
    return () => {
      ro.disconnect()
      document.fonts.removeEventListener("loadingdone", fit)
    }
  }, [])

  useGSAP(
    () => {
      const root = rootRef.current
      const headline = headlineRef.current
      if (!root || !headline) return
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

      // Headline lines rise inside masks
      let split: SplitText | undefined
      document.fonts.ready.then(() => {
        split = splitLines(headline)
        gsap.from(split.lines, {
          yPercent: HIDDEN_Y,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: { trigger: headline, start: "top 80%", once: true },
          onComplete: () => split?.revert(),
        })
      })

      // Supporting copy, CTA row, status
      gsap.fromTo(
        root.querySelectorAll("[data-cta]"),
        { autoAlpha: 0, y: 20 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.08,
          delay: 0.3,
          scrollTrigger: { trigger: headline, start: "top 80%", once: true },
        },
      )

      // Info columns
      gsap.fromTo(
        root.querySelectorAll("[data-col]"),
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: "[data-columns]", start: "top 85%", once: true },
        },
      )

      // Giant name letters rise once the name enters the viewport. (Not scrubbed:
      // the name sits in the last ~150px of the page, so a scrub tied to the exact
      // scroll end could leave it hidden below the crop.)
      gsap.fromTo(
        root.querySelectorAll("[data-letter]"),
        { yPercent: 100 },
        {
          yPercent: 0,
          duration: 1,
          ease: "power3.out",
          stagger: 0.035,
          scrollTrigger: { trigger: "[data-name]", start: "top bottom", once: true },
        },
      )

      return () => split?.revert()
    },
    { scope: rootRef },
  )

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
    } catch {
      // Fallback for browsers without the async clipboard API
      const ta = document.createElement("textarea")
      ta.value = EMAIL
      ta.setAttribute("readonly", "")
      ta.style.position = "absolute"
      ta.style.left = "-9999px"
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const toTop = (e: React.MouseEvent) => {
    e.preventDefault()
    scrollTo(0)
  }

  return (
    <footer
      id="contact"
      ref={rootRef}
      className="relative overflow-hidden bg-bg px-6 pt-24 md:px-10 md:pt-32 lg:px-14 lg:pt-40"
      aria-labelledby="contact-heading"
    >
      {/* Same dotted arc as the loading screen, sitting behind everything */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <PredictiveArc background="#FAFAF7" style={{ position: "absolute", inset: 0 }} />
      </div>

      {/* CTA */}
      <div className="relative z-10 grid grid-cols-12 gap-x-6">
        <div className="col-span-12 lg:col-span-10">
          <p className="mb-8 flex items-center gap-3 text-[13px] font-medium tracking-[0.08em] uppercase">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
            Contact
          </p>
          <h2
            id="contact-heading"
            ref={headlineRef}
            className="max-w-[16ch] text-[clamp(44px,6vw,112px)] leading-[1.02] font-medium tracking-[-0.03em]"
          >
            <Highlight text={contact.headline} word={contact.highlight} />
          </h2>
          <p data-cta className="mt-8 max-w-[52ch] text-[17px] leading-[1.6] text-muted md:text-[18px]">
            {contact.support}
          </p>

          <div data-cta className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-4">
            <a
              href={`mailto:${EMAIL}`}
              className="group relative inline-block overflow-hidden rounded-md px-1 text-[clamp(22px,2.6vw,40px)] font-medium tracking-[-0.02em] before:absolute before:inset-0 before:origin-left before:scale-x-0 before:bg-primary before:transition-transform before:duration-500 before:ease-out hover:before:scale-x-100 motion-reduce:before:transition-none"
            >
              <span className="relative z-10 transition-colors duration-300 group-hover:text-white">{EMAIL}</span>
            </a>
            <button
              type="button"
              onClick={copyEmail}
              aria-live="polite"
              className="rounded-full border border-line px-4 py-2 text-[14px] font-medium transition-colors duration-300 hover:border-ink"
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>

          <div data-cta className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
            <BookCallButton />
            {site.available && (
              <p className="flex items-center gap-3 text-[14px] text-muted">
                <span className="relative flex size-2">
                  <span aria-hidden="true" className="absolute inset-0 animate-pulse-soft rounded-full bg-primary" />
                  <span className="relative size-2 rounded-full bg-primary" />
                </span>
                {site.availableText}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Info columns */}
      <div data-columns className="relative z-10 mt-24 border-t border-line pt-14 md:mt-32 md:pt-16">
        <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-12">
          <nav data-col aria-label="Footer" className="lg:col-span-3">
            <h3 className="mb-5 text-[12px] font-medium tracking-[0.08em] text-muted uppercase">Navigation</h3>
            <ul className="flex flex-col gap-2.5 text-[16px]">
              <li>
                <HashLink href="/" className={underlineClass}>
                  Home
                </HashLink>
              </li>
              {NAV.map((item) => (
                <li key={item.href}>
                  <HashLink href={item.href} className={underlineClass}>
                    {item.label}
                  </HashLink>
                </li>
              ))}
            </ul>
          </nav>

          <div data-col className="lg:col-span-3">
            <h3 className="mb-5 text-[12px] font-medium tracking-[0.08em] text-muted uppercase">Socials</h3>
            <ul className="flex flex-col gap-2.5 text-[16px]">
              {site.socials.map((s) => (
                <li key={s.href}>
                  <UnderlineLink href={s.href} target="_blank" rel="noopener noreferrer" className="group">
                    {s.label}
                    <span
                      aria-hidden="true"
                      className="ml-1 inline-block -translate-x-1 opacity-0 transition-[transform,opacity] duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100"
                    >
                      ↗
                    </span>
                  </UnderlineLink>
                </li>
              ))}
            </ul>
          </div>

          <div data-col className="lg:col-span-3">
            <h3 className="mb-5 text-[12px] font-medium tracking-[0.08em] text-muted uppercase">Location</h3>
            <p className="text-[16px]">{site.location}</p>
            <p className="mt-1 text-[16px] text-muted">{site.locationNote}</p>
          </div>

          <div data-col className="lg:col-span-3">
            <h3 className="mb-5 text-[12px] font-medium tracking-[0.08em] text-muted uppercase">Local time</h3>
            <LocalTime />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 mt-16 flex flex-col gap-3 border-t border-line py-6 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between md:mt-20">
        <p>&copy; {YEAR} {NAME}. All rights reserved.</p>
        <p>Designed &amp; built by {NAME}</p>
        <a href="#" onClick={toTop} className="transition-colors duration-300 hover:text-ink">
          Back to top ↑
        </a>
      </div>

      {/* Giant name, cropped at the bottom edge */}
      <div data-name aria-hidden="true" className="relative z-10 overflow-hidden">
        <div
          ref={nameRef}
          className="flex w-max leading-none font-semibold tracking-[-0.05em] whitespace-nowrap text-ink select-none"
        >
          {NAME.toUpperCase()
            .split("")
            .map((ch, i) => (
              <span key={i} data-letter className="inline-block will-change-transform">
                {ch === " " ? " " : ch}
              </span>
            ))}
        </div>
      </div>
    </footer>
  )
}

/** Live IST clock, rendered client-side only to avoid hydration mismatch. */
function LocalTime() {
  const [time, setTime] = useState<string | null>(null)

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
    const tick = () => setTime(`${fmt.format(new Date())} IST`)
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <p className="text-[16px] tabular-nums" aria-live="off">
      {time ?? " "}
    </p>
  )
}
