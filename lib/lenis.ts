import type Lenis from "lenis"

let instance: Lenis | null = null
let locked = false

export const setLenis = (lenis: Lenis | null) => {
  instance = lenis
  if (lenis && locked) lenis.stop()
}

/** Freeze/unfreeze scrolling (used while the preloader or a modal is open). Safe to call before Lenis exists. */
export const lockScroll = (value: boolean) => {
  locked = value
  if (!instance) return
  if (value) instance.stop()
  else instance.start()
}

type ScrollOpts = { offset?: number; immediate?: boolean; force?: boolean }

/** Smooth-scroll to a target (px or element/selector), with a native fallback when Lenis isn't running. */
export const scrollTo = (target: number | string | HTMLElement, opts: ScrollOpts = {}) => {
  if (instance) {
    instance.scrollTo(target, opts)
    return
  }
  if (typeof target === "number") window.scrollTo({ top: target + (opts.offset ?? 0) })
  else {
    const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + (opts.offset ?? 0) })
  }
}
