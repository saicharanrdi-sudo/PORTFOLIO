"use client"

import { useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { blur } from "@/lib/perf"
import { useContent } from "./ContentProvider"

gsap.registerPlugin(ScrollTrigger, useGSAP)

const INTERVAL = 6
const SWIPE_PX = 50
const pad = (i: number) => String(i + 1).padStart(2, "0")

export default function Testimonials() {
  const { testimonials } = useContent()
  const TESTIMONIALS = testimonials.items
  const rootRef = useRef<HTMLElement>(null)
  const n = TESTIMONIALS.length

  const { contextSafe } = useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches

      const stage = root.querySelector<HTMLElement>("[data-stage]")!
      const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-quote]"))
      const words = layers.map((l) => Array.from(l.querySelectorAll<HTMLElement>("[data-w]")))
      const sr = root.querySelector<HTMLElement>("[data-sr]")!
      const nameEl = root.querySelector<HTMLElement>("[data-name]")!
      const roleEl = root.querySelector<HTMLElement>("[data-role]")!
      const counter = root.querySelector<HTMLElement>("[data-counter]")!
      const avatars = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-avatar]"))
      const bar = root.querySelector<HTMLElement>("[data-bar]")!

      // Initial state: first quote visible, others parked below
      words.forEach((ws, i) => gsap.set(ws, { autoAlpha: i === 0 ? 1 : 0, y: i === 0 ? 0 : 20 }))
      gsap.set(bar, { scaleX: 0, transformOrigin: "left center" })

      let active = 0
      let counterTl: gsap.core.Timeline | null = null
      let hovered = false
      let visible = false

      const paintAvatars = (i: number) =>
        avatars.forEach((a, j) => {
          a.dataset.active = String(j === i)
          a.setAttribute("aria-pressed", String(j === i))
        })
      paintAvatars(0)

      // ---- Timer: the progress bar IS the timer ----
      const timer = gsap.fromTo(
        bar,
        { scaleX: 0 },
        { scaleX: 1, duration: INTERVAL, ease: "none", paused: true, onComplete: () => go(active + 1) },
      )
      const syncTimer = () => {
        if (reduce) return
        if (visible && !hovered) timer.play()
        else timer.pause()
      }
      const restartTimer = () => {
        timer.restart(true)
        syncTimer()
      }

      // ---- Swap ----
      const swap = (from: number, to: number) => {
        const t = TESTIMONIALS[to]
        gsap.killTweensOf([...words[from], ...words[to], nameEl, roleEl])

        if (reduce) {
          gsap.set(words[from], { autoAlpha: 0 })
          gsap.set(words[to], { autoAlpha: 1, y: 0, filter: "none" })
        } else {
          gsap.to(words[from], { y: -16, autoAlpha: 0, filter: blur(4), duration: 0.4, ease: "power2.in", stagger: 0.012 })
          gsap.fromTo(
            words[to],
            { y: 20, autoAlpha: 0, filter: blur(4) },
            { y: 0, autoAlpha: 1, filter: blur(0), duration: 0.6, ease: "power3.out", stagger: 0.02, delay: 0.25 },
          )
        }

        gsap.to([nameEl, roleEl], {
          autoAlpha: 0,
          y: -6,
          duration: reduce ? 0 : 0.25,
          ease: "power2.in",
          onComplete: () => {
            nameEl.textContent = t.name
            roleEl.textContent = `${t.role}, ${t.company}`
            sr.textContent = t.quote
            gsap.fromTo([nameEl, roleEl], { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: reduce ? 0 : 0.45, ease: "power3.out", stagger: 0.05 })
          },
        })

        counterTl?.kill()
        counterTl = gsap
          .timeline()
          .to(counter, { yPercent: -100, autoAlpha: 0, duration: reduce ? 0 : 0.22, ease: "power2.in" })
          .add(() => {
            counter.textContent = pad(to)
          })
          .fromTo(counter, { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: reduce ? 0 : 0.4, ease: "power3.out" })

        paintAvatars(to)
      }

      const go = (to: number) => {
        const next = ((to % n) + n) % n
        if (next !== active) {
          swap(active, next)
          active = next
        }
        restartTimer()
      }
      ;(root as HTMLElement & { __go?: (i: number) => void }).__go = go

      // ---- Pause on hover / off-screen ----
      const onEnter = () => {
        hovered = true
        syncTimer()
      }
      const onLeave = () => {
        hovered = false
        syncTimer()
      }
      stage.addEventListener("pointerenter", onEnter)
      stage.addEventListener("pointerleave", onLeave)

      const io = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting
          syncTimer()
        },
        { threshold: 0.35 },
      )
      io.observe(root)

      // ---- Swipe ----
      let startX: number | null = null
      const onDown = (e: PointerEvent) => {
        if (e.pointerType === "mouse") return
        startX = e.clientX
      }
      const onUp = (e: PointerEvent) => {
        if (startX === null) return
        const dx = e.clientX - startX
        startX = null
        if (Math.abs(dx) < SWIPE_PX) return
        go(dx < 0 ? active + 1 : active - 1)
      }
      stage.addEventListener("pointerdown", onDown)
      stage.addEventListener("pointerup", onUp)
      stage.addEventListener("pointercancel", () => (startX = null))

      // ---- Reveal on scroll-in ----
      if (!reduce) {
        gsap.fromTo(
          root.querySelectorAll("[data-reveal]"),
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.08,
            scrollTrigger: { trigger: root, start: "top 80%", once: true },
          },
        )
      }

      return () => {
        stage.removeEventListener("pointerenter", onEnter)
        stage.removeEventListener("pointerleave", onLeave)
        stage.removeEventListener("pointerdown", onDown)
        stage.removeEventListener("pointerup", onUp)
        io.disconnect()
        timer.kill()
        counterTl?.kill()
      }
    },
    { scope: rootRef, dependencies: [n] },
  )

  const go = contextSafe((i: number) => {
    ;(rootRef.current as (HTMLElement & { __go?: (i: number) => void }) | null)?.__go?.(i)
  })

  return (
    <section
      id="testimonials"
      ref={rootRef}
      className="bg-bg px-6 py-[100px] md:px-10 lg:px-14 lg:py-[180px]"
      aria-labelledby="testimonials-heading"
    >
      {/* Header */}
      <div className="flex items-end justify-between gap-6">
        <div>
          <p data-reveal className="mb-6 flex items-center gap-3 text-[13px] font-medium tracking-[0.08em] uppercase">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
            Testimonials
          </p>
          <h2
            id="testimonials-heading"
            data-reveal
            className="max-w-[18ch] text-[clamp(32px,3.6vw,56px)] leading-[1.08] font-medium tracking-[-0.03em]"
          >
            {testimonials.heading}
          </h2>
        </div>
        <p data-reveal className="shrink-0 text-[15px] whitespace-nowrap tabular-nums" aria-live="polite">
          <span className="inline-block overflow-hidden align-bottom leading-[1.2]">
            <span data-counter className="inline-block text-primary">
              01
            </span>
          </span>
          <span className="text-muted"> / {pad(n - 1)}</span>
        </p>
      </div>

      {/* Stage */}
      <div
        data-stage
        data-reveal
        className="mt-20 flex flex-col items-center text-center [touch-action:pan-y] select-none md:mt-28"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none -mb-[0.3em] font-medium text-[clamp(72px,9vw,140px)] leading-none text-peach select-none"
        >
          &ldquo;
        </span>

        <div aria-live="polite" className="w-full max-w-[1000px]">
          <p data-sr className="sr-only">
            {TESTIMONIALS[0].quote}
          </p>
          <div aria-hidden="true" className="grid">
            {TESTIMONIALS.map((t, i) => (
              <p
                key={i}
                data-quote
                className="col-start-1 row-start-1 text-[clamp(28px,3.4vw,56px)] leading-[1.25] font-medium tracking-[-0.02em]"
              >
                {t.quote.split(" ").map((w, j) => (
                  <span key={j}>
                    <span data-w className="inline-block will-change-[transform,opacity,filter]">
                      {w}
                    </span>{" "}
                  </span>
                ))}
              </p>
            ))}
          </div>
        </div>

        <div className="mt-[clamp(32px,5vh,60px)]">
          <p data-name className="text-[17px] font-medium">
            {TESTIMONIALS[0].name}
          </p>
          <p data-role className="mt-1 text-[15px] text-muted">
            {TESTIMONIALS[0].role}, {TESTIMONIALS[0].company}
          </p>
        </div>

        {/* Controls */}
        <div className="mt-[clamp(32px,5vh,60px)] flex items-center gap-6">
          <ArrowButton dir="prev" onClick={() => go(-1 + currentIndex(rootRef.current))} />
          <div className="flex items-center gap-3" role="group" aria-label="Choose testimonial">
            {TESTIMONIALS.map((t, i) => (
              <button
                key={i}
                type="button"
                data-avatar
                onClick={() => go(i)}
                aria-label={`Show testimonial from ${t.name}`}
                className="flex size-14 items-center justify-center rounded-full border border-line bg-white text-[14px] font-medium transition-[transform,border-color,box-shadow] duration-300 ease-out hover:scale-110 hover:border-primary data-[active=true]:shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-primary)] motion-reduce:transition-none"
              >
                {t.initials}
              </button>
            ))}
          </div>
          <ArrowButton dir="next" onClick={() => go(1 + currentIndex(rootRef.current))} />
        </div>

        {/* Timer */}
        <div className="mt-6 h-px w-[200px] bg-line" aria-hidden="true">
          <div data-bar className="h-full w-full origin-left bg-primary will-change-transform" />
        </div>
      </div>
    </section>
  )
}

/** Reads the active index from the avatar row so the arrow handlers don't need React state. */
function currentIndex(root: HTMLElement | null) {
  if (!root) return 0
  const avatars = Array.from(root.querySelectorAll<HTMLElement>("[data-avatar]"))
  return Math.max(0, avatars.findIndex((a) => a.dataset.active === "true"))
}

function ArrowButton({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? "Previous testimonial" : "Next testimonial"}
      className="flex size-11 items-center justify-center rounded-full border border-line text-ink transition-[border-color,transform] duration-300 ease-out hover:border-ink hover:scale-105 motion-reduce:transition-none"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={dir === "prev" ? "rotate-180" : ""}>
        <path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
