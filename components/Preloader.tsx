"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"

const VIDEO_SRC = "/opening.mp4"
/** If the video never reports `ended` (stalled network, blocked autoplay), move on anyway. */
const SAFETY_MS = 15000

type Props = {
  /** Fired the moment the curtain starts lifting — the hero begins its intro here. */
  onReveal: () => void
  /** Fired once the curtain is fully off-screen so the parent can unmount it. */
  onDone: () => void
}

export default function Preloader({ onReveal, onDone }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const numRef = useRef<HTMLSpanElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const num = numRef.current
    const video = videoRef.current
    if (!root || !stage || !num || !video) return

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let raf = 0
    let finished = false
    let fallback: gsap.core.Tween | null = null

    const setPct = (p: number) => {
      num.textContent = `${Math.round(Math.min(100, Math.max(0, p)))}%`
    }

    // Counter follows the video: 0% at the first frame, 100% on the last
    const tick = () => {
      if (video.duration) setPct((video.currentTime / video.duration) * 100)
      raf = requestAnimationFrame(tick)
    }

    const exit = () => {
      const tl = gsap.timeline()
      if (reduce) {
        tl.add(onReveal, "+=0.2")
        tl.to(root, { autoAlpha: 0, duration: 0.4 }, "<")
      } else {
        // The whole screen — clip and counter included — lifts away as one piece
        tl.add(onReveal, "+=0.25")
        tl.to(root, { yPercent: -100, duration: 1.1, ease: "power3.inOut" }, "<")
      }
      tl.add(onDone)
    }

    const finish = () => {
      if (finished) return
      finished = true
      cancelAnimationFrame(raf)
      fallback?.kill()
      setPct(100)
      exit()
    }

    // No video (autoplay blocked / unsupported): count over ~1.5s instead
    const useFallback = () => {
      if (finished || fallback) return
      cancelAnimationFrame(raf)
      const c = { v: Number.parseFloat(num.textContent || "0") || 0 }
      fallback = gsap.to(c, { v: 100, duration: 1.5, ease: "none", onUpdate: () => setPct(c.v), onComplete: finish })
    }

    const onPlay = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(tick)
    }
    video.addEventListener("play", onPlay)
    video.addEventListener("ended", finish)
    video.addEventListener("error", useFallback)

    // Entrance: the clip and counter ease in together; playback begins as they appear
    const start = () => video.play().catch(useFallback)
    if (reduce) {
      gsap.set([stage, num], { autoAlpha: 1 })
      start()
    } else {
      gsap.fromTo(
        [stage, num],
        { autoAlpha: 0, y: 24, scale: 0.97 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, ease: "power3.out", stagger: 0.08, force3D: true, onStart: start },
      )
    }
    const safety = window.setTimeout(finish, SAFETY_MS)

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(safety)
      fallback?.kill()
      video.removeEventListener("play", onPlay)
      video.removeEventListener("ended", finish)
      video.removeEventListener("error", useFallback)
    }
    // callbacks are stable for the lifetime of the preloader
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="fixed inset-0 z-50 overflow-hidden bg-white will-change-transform"
    >
      {/* Centred at well under the clip's native height so every pixel stays sharp */}
      <div ref={stageRef} className="absolute inset-0 flex items-center justify-center will-change-[transform,opacity]">
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          muted
          playsInline
          preload="auto"
          className="h-[min(62vh,640px)] w-auto max-w-[80vw] object-contain"
        />
      </div>
      <span
        ref={numRef}
        className="absolute right-[clamp(16px,4vw,64px)] bottom-[clamp(16px,3vw,48px)] text-[clamp(96px,22vw,320px)] leading-none font-medium tracking-[-0.05em] text-ink tabular-nums select-none will-change-[transform,opacity]"
      >
        0%
      </span>
    </div>
  )
}
