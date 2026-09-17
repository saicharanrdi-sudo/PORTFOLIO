/**
 * Runtime capability hints for animation quality.
 *
 * Animated `filter: blur()` is cheap in Chromium (GPU) but forces per-frame
 * re-rasterisation in WebKit and Gecko, which is the single biggest source of
 * scroll jank in Safari. Those engines get the same motion without the blur.
 */
let cachedBlur: boolean | null = null

export function blurAllowed(): boolean {
  if (cachedBlur !== null) return cachedBlur
  if (typeof navigator === "undefined") return true
  const ua = navigator.userAgent
  const chromium = /Chrome|CriOS|Edg|OPR|SamsungBrowser/i.test(ua)
  const webkit = /Safari/i.test(ua) && !chromium
  const gecko = /Firefox|FxiOS/i.test(ua)
  cachedBlur = !(webkit || gecko)
  return cachedBlur
}

/** Blur string helper: "blur(Npx)" where supported (0 stays tweenable as "blur(0px)"), otherwise "none". */
export const blur = (px: number) => (blurAllowed() ? `blur(${px}px)` : "none")
