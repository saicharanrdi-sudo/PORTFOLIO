"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

import { useContent } from "./ContentProvider"
import { blurAllowed } from "@/lib/perf"
import { HIDDEN_Y } from "@/lib/split"

const pad = (i: number) => String(i + 1).padStart(2, "0")
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

// Spiral geometry (desktop)
const ANGLE_STEP = 70
const RADIUS = 560
const DEPTH = 400
const RISE = 120
const MAX_SKEW = 4
const MAX_TILT = 5
const VH_PER_PROJECT = 70

export default function Work() {
  const { work } = useContent()
  const PROJECTS = work.projects.filter((p) => p.featured).map((p) => ({ ...p, title: `${p.title}: ${p.subtitle}` }))
  const rootRef = useRef<HTMLElement>(null)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  useEffect(() => {
    if (reduced) return
    const root = rootRef.current
    if (!root) return

    const n = PROJECTS.length
    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-card]"))
    const inners = cards.map((c) => c.querySelector<HTMLElement>("[data-card-inner]")!)
    const titleWords = Array.from(root.querySelectorAll<HTMLElement>("[data-title]")).map((t) =>
      Array.from(t.querySelectorAll<HTMLElement>("[data-w]")),
    )
    const meta = {
      category: root.querySelector<HTMLElement>("[data-category]")!,
      year: root.querySelector<HTMLElement>("[data-year]")!,
      counter: root.querySelector<HTMLElement>("[data-counter]")!,
      visit: root.querySelector<HTMLAnchorElement>("[data-visit]")!,
    }
    const metaFade = [meta.category, meta.year, meta.counter, meta.visit]
    const bar = root.querySelector<HTMLElement>("[data-bar]")!
    const hint = root.querySelector<HTMLElement>("[data-hint]")

    const mm = gsap.matchMedia()

    mm.add({ desktop: "(min-width: 768px)", mobile: "(max-width: 767px)" }, (ctx) => {
      const { mobile } = ctx.conditions as { mobile: boolean }
      const useBlur = blurAllowed()

      const state = { vel: 0, skew: 0, active: 0 }
      const proxy = { p: 0 }
      const tilt = cards.map(() => ({ rx: 0, ry: 0, trx: 0, try: 0 }))

      // Only the first title is on screen to begin with
      titleWords.forEach((words, i) => gsap.set(words, { yPercent: i === 0 ? 0 : HIDDEN_Y }))
      gsap.set(bar, { scaleX: 0, transformOrigin: "left center" })

      // Scrubbed progress 0 → n-1, one viewport per project. scrub: 1.2 gives the liquid lag.
      const tween = gsap.to(proxy, {
        p: n - 1,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: `+=${n * VH_PER_PROJECT}%`,
          pin: true,
          scrub: 1.2,
          anticipatePin: 1,
          refreshPriority: 2,
          onUpdate: (self) => {
            state.vel = self.getVelocity()
          },
        },
      })
      const st = tween.scrollTrigger!

      const swapTitle = (from: number, to: number) => {
        gsap.killTweensOf([...titleWords[from], ...titleWords[to]])
        gsap.to(titleWords[from], { yPercent: -HIDDEN_Y, duration: 0.5, ease: "power3.in", stagger: 0.03 })
        gsap.fromTo(
          titleWords[to],
          { yPercent: HIDDEN_Y },
          { yPercent: 0, duration: 0.7, ease: "power3.out", stagger: 0.05, delay: 0.15 },
        )

        const next = PROJECTS[to]
        gsap.killTweensOf(metaFade)
        gsap.to(metaFade, {
          autoAlpha: 0,
          y: -6,
          duration: 0.2,
          ease: "power2.in",
          onComplete: () => {
            meta.category.textContent = next.category
            meta.year.textContent = next.year
            meta.counter.textContent = pad(to)
            meta.visit.href = next.url
            meta.visit.setAttribute("aria-label", `Visit ${next.title} site`)
            gsap.fromTo(
              metaFade,
              { autoAlpha: 0, y: 6 },
              { autoAlpha: 1, y: 0, duration: 0.45, ease: "power3.out" },
            )
          },
        })
      }

      const tick = () => {
        const p = proxy.p

        // Velocity skew: bends with fast scrolling, relaxes when it stops
        state.vel *= 0.9
        const targetSkew = clamp(state.vel * 0.0025, -MAX_SKEW, MAX_SKEW)
        state.skew = lerp(state.skew, targetSkew, 0.1)

        cards.forEach((card, i) => {
          const off = i - p
          const a = Math.abs(off)
          let transform: string
          let opacity: number
          let blur = 0

          if (mobile) {
            // Vertical stack with a gentle curve, no depth
            const x = Math.sin(off * 0.9) * 32
            const y = off * 150
            const s = Math.max(0.7, 1 - a * 0.15)
            opacity = a > 1.6 ? 0 : Math.max(0, 1 - a * 0.75)
            transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`
          } else {
            const angle = off * ANGLE_STEP
            const radius = RADIUS * Math.max(0.35, 1 - a * 0.3)
            const x = Math.sin((angle * Math.PI) / 180) * radius
            const y = off * RISE
            const z = -a * DEPTH
            const s = Math.max(0.6, 1 - a * 0.22)
            opacity = a > 2.4 ? 0 : Math.max(0.3, 1 - a * 0.5)
            blur = Math.min(6, a * 4)
            transform =
              `translate3d(${x}px, ${y}px, ${z}px) rotateY(${angle * 0.6}deg) ` +
              `rotateZ(${off * 6}deg) skewY(${state.skew}deg) scale(${s})`
          }

          card.style.transform = transform
          card.style.opacity = String(opacity)
          if (useBlur) card.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none"
          card.style.zIndex = String(100 - Math.round(a * 10))
          card.style.pointerEvents = a > 1.6 ? "none" : "auto"

          if (!mobile) {
            const t = tilt[i]
            t.rx = lerp(t.rx, t.trx, 0.12)
            t.ry = lerp(t.ry, t.try, 0.12)
            inners[i].style.transform = `rotateX(${t.rx.toFixed(2)}deg) rotateY(${t.ry.toFixed(2)}deg)`
          }
        })

        bar.style.transform = `scaleX(${(p / (n - 1)).toFixed(4)})`
        if (hint) {
          // Visible on the first card, gone once the stack starts moving
          const o = Math.max(0, 1 - p * 4)
          hint.style.opacity = o.toFixed(3)
          hint.style.transform = `translate(-50%, ${((1 - o) * 12).toFixed(1)}px)`
        }

        const active = clamp(Math.round(p), 0, n - 1)
        if (active !== state.active) {
          swapTitle(state.active, active)
          state.active = active
        }
      }
      gsap.ticker.add(tick)

      // Hover tilt toward the pointer (desktop only)
      const cleanups: Array<() => void> = []
      cards.forEach((card, i) => {
        if (!mobile) {
          const onMove = (e: PointerEvent) => {
            const r = card.getBoundingClientRect()
            const nx = ((e.clientX - r.left) / r.width) * 2 - 1
            const ny = ((e.clientY - r.top) / r.height) * 2 - 1
            tilt[i].try = nx * MAX_TILT
            tilt[i].trx = -ny * MAX_TILT
          }
          const onLeave = () => {
            tilt[i].trx = 0
            tilt[i].try = 0
          }
          card.addEventListener("pointermove", onMove)
          card.addEventListener("pointerleave", onLeave)
          cleanups.push(() => {
            card.removeEventListener("pointermove", onMove)
            card.removeEventListener("pointerleave", onLeave)
          })
        }
        // Keyboard: focusing a card scrolls the spiral to it
        const onFocus = () => st.scroll(st.start + ((st.end - st.start) * i) / (n - 1))
        card.addEventListener("focus", onFocus)
        cleanups.push(() => card.removeEventListener("focus", onFocus))
      })

      return () => {
        gsap.ticker.remove(tick)
        cleanups.forEach((fn) => fn())
        cards.forEach((c) => c.removeAttribute("style"))
        inners.forEach((c) => c.removeAttribute("style"))
      }
    })

    document.fonts.ready.then(() => ScrollTrigger.refresh())
    return () => mm.revert()
  }, [reduced, PROJECTS.length])

  if (reduced) return <StaticWork projects={PROJECTS} />

  return (
    <section
      id="work"
      ref={rootRef}
      className="relative h-svh overflow-hidden bg-bg"
      aria-labelledby="work-heading"
    >
      {/* Header */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between px-6 pt-8 md:px-10 md:pt-10 lg:px-14">
        <div>
          <p className="mb-4 flex items-center gap-3 text-[13px] font-medium tracking-[0.08em] uppercase">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
            Selected Work
          </p>
          <h2 id="work-heading" className="text-[clamp(22px,2.2vw,32px)] leading-tight font-medium tracking-[-0.02em]">
            Work that speaks for itself.
          </h2>
        </div>
        <p className="text-[15px] tabular-nums" aria-live="polite">
          <span data-counter>01</span>
          <span className="text-muted"> / {pad(PROJECTS.length - 1)}</span>
        </p>
      </div>

      {/* Stage */}
      <div className="absolute inset-0 z-10 [perspective:1400px] max-md:bottom-[26vh] max-md:top-[10vh] md:top-[6vh] md:bottom-[26vh]">
        {PROJECTS.map((project) => (
          <div key={project.url} className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <a
              data-card
              data-cursor-label="View Project"
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View ${project.title.split(":")[0]} project`}
              className="group relative block aspect-[16/10] w-[min(40vw,560px)] overflow-hidden rounded-[20px] bg-surface shadow-[0_24px_60px_-24px_rgba(17,17,17,0.18)] [transform-style:preserve-3d] [backface-visibility:hidden] will-change-[transform,opacity,filter] max-md:w-[78vw]"
            >
              <div data-card-inner className="absolute inset-0 will-change-transform">
                <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]">
                  {project.image ? (
                    <Image
                      src={project.image}
                      alt=""
                      fill
                      sizes="(max-width: 767px) 78vw, 640px"
                      loading="lazy"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-surface">
                      <span className="text-[clamp(16px,1.6vw,22px)] font-medium tracking-[-0.01em] text-muted">
                        {project.title.split(":")[0]}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </a>
          </div>
        ))}
      </div>

      {/* Footer: title + meta */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-5 px-6 pb-10 md:flex-row md:items-end md:justify-between md:px-10 md:pb-14 lg:px-14">
        <div className="grid max-w-[66vw] max-md:max-w-full">
          {PROJECTS.map((project, i) => (
            <h3
              key={project.url}
              data-title
              aria-hidden={i !== 0}
              className="col-start-1 row-start-1 self-end text-[clamp(36px,4.4vw,72px)] leading-[1.02] font-medium tracking-[-0.03em] max-md:text-[32px]"
            >
              <Word className="mr-[0.25em] align-top text-[0.32em] leading-none text-primary" style={{ marginTop: "0.28em" }}>
                {pad(i)}
              </Word>
              {project.title.split(" ").map((w, j) => (
                <Word key={j} className="mr-[0.22em]">
                  {w}
                </Word>
              ))}
            </h3>
          ))}
        </div>

        <div className="flex shrink-0 flex-col gap-2 text-[15px] md:items-end">
          <p className="text-muted">
            <span data-category>{PROJECTS[0].category}</span>
            <span aria-hidden="true"> · </span>
            <span data-year>{PROJECTS[0].year}</span>
          </p>
          <a
            data-visit
            href={PROJECTS[0].url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit ${PROJECTS[0].title} site`}
            className="relative inline-block font-medium after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-out hover:after:origin-left hover:after:scale-x-100"
          >
            Visit site&nbsp;↗
          </a>
        </div>
      </div>

      {/* Scroll hint */}
      <div
        data-hint
        aria-hidden="true"
        className="pointer-events-none absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5 text-[12px] font-medium tracking-[0.08em] text-muted uppercase will-change-[transform,opacity]"
      >
        Scroll
        <span className="relative flex h-7 w-4 items-start justify-center rounded-full border border-line">
          <span className="mt-1.5 block h-1.5 w-0.5 animate-scroll-dot rounded-full bg-primary" />
        </span>
      </div>

      {/* Progress */}
      <div
        data-bar
        aria-hidden="true"
        className="absolute bottom-0 left-0 z-20 h-px w-full origin-left scale-x-0 bg-primary will-change-transform"
      />
    </section>
  )
}

/** One masked word: the outer span clips, the inner span slides. */
function Word({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <span className={`inline-block overflow-hidden pt-[0.1em] -mt-[0.1em] pb-[0.25em] -mb-[0.25em] align-bottom ${className}`} style={style}>
      <span data-w className="inline-block will-change-transform">
        {children}
      </span>
    </span>
  )
}

/** prefers-reduced-motion: a plain list, no pinning or transforms. */
function StaticWork({ projects: PROJECTS }: { projects: Array<{ title: string; category: string; year: string; url: string; image?: string }> }) {
  return (
    <section id="work" className="bg-bg px-6 py-24 md:px-10 md:py-32 lg:px-14" aria-labelledby="work-heading">
      <p className="mb-4 flex items-center gap-3 text-[13px] font-medium tracking-[0.08em] uppercase">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
        Selected Work
      </p>
      <h2 id="work-heading" className="mb-16 text-[clamp(22px,2.2vw,32px)] leading-tight font-medium tracking-[-0.02em]">
        Work that speaks for itself.
      </h2>
      <ul className="grid gap-16 md:grid-cols-2">
        {PROJECTS.map((project, i) => (
          <li key={project.url}>
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View ${project.title.split(":")[0]} project`}
              className="group block"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-[20px] bg-surface">
                {project.image ? (
                  <Image src={project.image} alt="" fill sizes="(max-width: 767px) 100vw, 50vw" loading="lazy" className="object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <span className="text-[18px] font-medium text-muted">{project.title.split(":")[0]}</span>
                  </div>
                )}
              </div>
              <p className="mt-6 text-[13px] font-medium text-primary">{pad(i)}</p>
              <h3 className="mt-2 text-[clamp(24px,2.4vw,36px)] leading-tight font-medium tracking-[-0.02em]">
                {project.title}
              </h3>
              <p className="mt-2 text-[15px] text-muted">
                {project.category} · {project.year}
              </p>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
