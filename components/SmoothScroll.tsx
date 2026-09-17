"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import Lenis from "lenis"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import "lenis/dist/lenis.css"
import { setLenis, scrollTo } from "@/lib/lenis"

gsap.registerPlugin(ScrollTrigger)
// Promote all transforms to 3D so every browser composites them on the GPU
gsap.config({ force3D: true })
ScrollTrigger.config({ limitCallbacks: true, ignoreMobileResize: true })

const HASH_OFFSET = -80

/**
 * The single Lenis instance for the whole app, mounted once in the root layout.
 * Lenis drives scroll, GSAP's ticker drives Lenis, and ScrollTrigger listens to Lenis.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const lenis = new Lenis({
      lerp: 0.075,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
      // Drive touch scrolling through Lenis too, so phones get the same easing as desktop
      syncTouch: true,
      syncTouchLerp: 0.09,
      anchors: { offset: HASH_OFFSET },
    })
    setLenis(lenis)

    lenis.on("scroll", ScrollTrigger.update)
    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    // Layout can shift once webfonts and images land, so recompute trigger positions
    const refresh = () => ScrollTrigger.refresh()
    document.fonts.ready.then(refresh)
    if (document.readyState === "complete") refresh()
    else window.addEventListener("load", refresh)

    return () => {
      window.removeEventListener("load", refresh)
      gsap.ticker.remove(raf)
      lenis.destroy()
      setLenis(null)
    }
  }, [])

  // Route change: jump to top, then once the new page has laid out, refresh triggers
  // and honour any hash in the URL
  useEffect(() => {
    scrollTo(0, { immediate: true, force: true })
    const t = window.setTimeout(() => {
      ScrollTrigger.refresh()
      const hash = window.location.hash.slice(1)
      if (!hash) return
      const el = document.getElementById(hash)
      if (el) scrollTo(el, { offset: HASH_OFFSET })
    }, 300)
    return () => window.clearTimeout(t)
  }, [pathname])

  return <>{children}</>
}
