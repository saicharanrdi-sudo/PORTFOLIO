"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"

const INTERACTIVE = "a, button, [data-cursor]"
const DOT = 10
const LABEL_SIZE = 110

type Mode = "dot" | "hover" | "label"

/**
 * Site-wide cursor. A small ink dot that scales over links, and morphs into
 * an orange labelled circle over anything carrying `data-cursor-label`.
 */
export default function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    const text = textRef.current
    if (!el || !text) return
    // Touch / coarse-pointer devices keep the native cursor behaviour
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    document.documentElement.classList.add("has-cursor")
    gsap.set(el, { xPercent: -50, yPercent: -50, autoAlpha: 0, width: DOT, height: DOT })

    const xTo = gsap.quickTo(el, "x", { duration: 0.16, ease: "power3.out" })
    const yTo = gsap.quickTo(el, "y", { duration: 0.16, ease: "power3.out" })

    let shown = false
    let mode: Mode = "dot"

    const setMode = (next: Mode, label?: string) => {
      if (next === mode && next !== "label") return
      if (next === "label" && mode === "label" && text.textContent === label) return
      mode = next
      // Only kill the mode tweens; the quickTo x/y tweens must survive
      gsap.killTweensOf(el, "width,height,scale,backgroundColor")
      gsap.killTweensOf(text)
      if (next === "label") {
        text.textContent = label ?? ""
        gsap.to(el, {
          width: LABEL_SIZE,
          height: LABEL_SIZE,
          scale: 1,
          backgroundColor: "#ff5b1f",
          duration: 0.5,
          ease: "elastic.out(1, 0.75)",
        })
        gsap.to(text, { autoAlpha: 1, duration: 0.25, delay: 0.08 })
      } else {
        gsap.to(el, {
          width: DOT,
          height: DOT,
          scale: next === "hover" ? 2.6 : 1,
          backgroundColor: "#111111",
          duration: 0.4,
          ease: "power3.out",
        })
        gsap.to(text, { autoAlpha: 0, duration: 0.12 })
      }
    }

    const onMove = (e: MouseEvent) => {
      xTo(e.clientX)
      yTo(e.clientY)
      if (!shown) {
        shown = true
        gsap.to(el, { autoAlpha: 1, duration: 0.3 })
      }
    }
    const onOver = (e: MouseEvent) => {
      const target = e.target as Element | null
      const labelled = target?.closest<HTMLElement>("[data-cursor-label]")
      if (labelled) return setMode("label", labelled.dataset.cursorLabel)
      setMode(target?.closest(INTERACTIVE) ? "hover" : "dot")
    }
    const onLeave = () => {
      shown = false
      gsap.to(el, { autoAlpha: 0, duration: 0.2 })
    }

    window.addEventListener("mousemove", onMove, { passive: true })
    document.addEventListener("mouseover", onOver)
    document.documentElement.addEventListener("mouseleave", onLeave)

    return () => {
      document.documentElement.classList.remove("has-cursor")
      window.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseover", onOver)
      document.documentElement.removeEventListener("mouseleave", onLeave)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[100] flex items-center justify-center rounded-full bg-ink opacity-0"
    >
      <span ref={textRef} className="text-[13px] font-medium whitespace-nowrap text-white opacity-0" />
    </div>
  )
}
