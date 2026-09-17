import { SplitText } from "gsap/SplitText"

/**
 * Splits an element into masked lines for a slide-up reveal.
 *
 * SplitText's masks clip to the line box, which at tight line-heights cuts
 * descenders (g, y, p). We pad each mask and cancel the padding with a
 * negative margin, so glyphs stay whole while layout is unchanged. Callers
 * should `revert()` the split once the reveal finishes so no clipping remains.
 */
/** Offset (%) that fully hides a line inside a padded mask. */
export const HIDDEN_Y = 140

export function splitLines(el: Element): SplitText {
  const split = SplitText.create(el, { type: "lines", mask: "lines" })
  split.masks?.forEach((mask) => {
    const m = mask as HTMLElement
    m.style.paddingTop = "0.12em"
    m.style.marginTop = "-0.12em"
    m.style.paddingBottom = "0.25em"
    m.style.marginBottom = "-0.25em"
  })
  return split
}
