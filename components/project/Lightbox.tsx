"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import gsap from "gsap"
import { lockScroll } from "@/lib/lenis"
import type { GalleryItem } from "@/data/projects"

const SWIPE_PX = 50

export default function Lightbox({
  items,
  index,
  onClose,
  onIndex,
}: {
  items: GalleryItem[]
  index: number
  onClose: () => void
  onIndex: (i: number) => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [reduce] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  const item = items[index]
  const n = items.length
  const go = (d: number) => onIndex(((index + d) % n + n) % n)

  useEffect(() => {
    const returnTo = document.activeElement as HTMLElement | null
    lockScroll(true)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeRef.current?.focus()
    if (!reduce && rootRef.current) {
      gsap.fromTo(rootRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power2.out" })
    }
    return () => {
      document.body.style.overflow = prevOverflow
      lockScroll(false)
      returnTo?.focus?.()
    }
  }, [reduce])

  // Image swap animation
  const figRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (reduce || !figRef.current) return
    gsap.fromTo(figRef.current, { autoAlpha: 0, scale: 0.98 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "power3.out" })
  }, [index, reduce])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return onClose()
    if (e.key === "ArrowRight") return go(1)
    if (e.key === "ArrowLeft") return go(-1)
    if (e.key === "Tab" && rootRef.current) {
      const nodes = Array.from(rootRef.current.querySelectorAll<HTMLElement>("button"))
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  let startX: number | null = null
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") startX = e.clientX
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (startX === null) return
    const dx = e.clientX - startX
    startX = null
    if (Math.abs(dx) >= SWIPE_PX) go(dx < 0 ? 1 : -1)
  }

  return createPortal(
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={item.caption || `Image ${index + 1} of ${n}`}
      onKeyDown={onKeyDown}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-ink/92 p-4 [touch-action:pan-y] select-none md:p-10"
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-5 right-5 flex size-11 items-center justify-center rounded-full border border-white/20 text-white transition-colors duration-300 hover:bg-white/10"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        </svg>
      </button>

      <figure ref={figRef} className="flex max-h-full w-full max-w-[1400px] flex-col items-center gap-4">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[24px] bg-surface">
          <Image src={item.image} alt={item.caption || ""} fill sizes="100vw" className="object-cover" priority />
        </div>
        <figcaption className="text-[14px] text-white/80">
          {item.caption}
          <span className="ml-3 text-white/40 tabular-nums">
            {index + 1} / {n}
          </span>
        </figcaption>
      </figure>

      {n > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous image"
            className="absolute top-1/2 left-4 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 text-white transition-colors duration-300 hover:bg-white/10 md:left-8"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="rotate-180">
              <path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next image"
            className="absolute top-1/2 right-4 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 text-white transition-colors duration-300 hover:bg-white/10 md:right-8"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}
    </div>,
    document.body,
  )
}
