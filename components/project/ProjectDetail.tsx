"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { isPlaceholder, type Project } from "@/data/projects"
import { HIDDEN_Y } from "@/lib/split"
import MagneticButton from "../MagneticButton"
import Lightbox from "./Lightbox"

gsap.registerPlugin(ScrollTrigger, useGSAP)

type P = Required<Project>
type Props = { project: P; prev: P | null; next: P | null }

const STICKY_BASE = 96
const STICKY_STEP = 12
const stickyTop = (i: number) => STICKY_BASE + Math.min(i, 4) * STICKY_STEP
const GHOST = "#e6e4df"
const INK = "#111111"

const has = (v: string | undefined) => !isPlaceholder(v)
const domain = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

/** Masked word for slide-up reveals (padding keeps descenders intact). */
function Word({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-block overflow-hidden pt-[0.1em] -mt-[0.1em] pb-[0.25em] -mb-[0.25em] align-bottom ${className}`}>
      <span data-word className="inline-block will-change-transform">
        {children}
      </span>
    </span>
  )
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`flex items-center gap-3 text-[13px] font-medium tracking-[0.08em] uppercase ${className}`}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
      {children}
    </p>
  )
}

const refresh = () => ScrollTrigger.refresh()

export default function ProjectDetail({ project, prev, next }: Props) {
  const rootRef = useRef<HTMLElement>(null)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const hasUrl = !!project.url && project.url !== "#"
  const gallery = project.gallery.filter((g) => g.image)
  const colors = project.designSystem.colors.filter((c) => c.hex)
  const showDesign = colors.length > 0 || has(project.designSystem.headingFont) || has(project.designSystem.notes)
  const showChallenge = has(project.challenge) || has(project.approach)
  const showOutcome = has(project.outcome) || project.skillsShown.length > 0

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const mm = gsap.matchMedia()

      mm.add("(prefers-reduced-motion: reduce)", () => {
        // Everything is visible by default; nothing to do
      })

      mm.add(
        { desktop: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)", mobile: "(max-width: 1023px) and (prefers-reduced-motion: no-preference)" },
        (ctx) => {
          const { mobile } = ctx.conditions as { mobile: boolean }
          const fadeUp = (targets: gsap.TweenTarget, trigger: Element, vars: gsap.TweenVars = {}) =>
            gsap.fromTo(
              targets,
              { autoAlpha: 0, y: 30 },
              { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", force3D: true, ...vars, scrollTrigger: { trigger, start: "top 85%", once: true } },
            )

          // 1. Header: title words rise, then the rest fades up
          gsap
            .timeline({ delay: 0.1 })
            .fromTo("[data-title] [data-word]", { yPercent: HIDDEN_Y }, { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.05, force3D: true })
            .fromTo("[data-header-fade]", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.08 }, "-=0.7")

          // 2. Meta row
          const meta = root.querySelector("[data-meta]")
          if (meta) fadeUp(meta.querySelectorAll("[data-meta-col]"), meta, { stagger: 0.08 })

          // 3. Cover: clip reveal on load, parallax on scroll
          const cover = root.querySelector<HTMLElement>("[data-cover]")
          const coverImg = root.querySelector<HTMLElement>("[data-cover-img]")
          if (cover) {
            gsap.fromTo(
              cover,
              { clipPath: "inset(12% 8% 12% 8% round 36px)" },
              { clipPath: "inset(0% 0% 0% 0% round 36px)", duration: 1.4, ease: "expo.out", delay: 0.2 },
            )
            if (coverImg && !mobile) {
              gsap.fromTo(
                coverImg,
                { yPercent: -8 },
                { yPercent: 8, ease: "none", force3D: true, scrollTrigger: { trigger: cover, start: "top bottom", end: "bottom top", scrub: true } },
              )
            }
          }

          // 4. Overview: words colour in with scroll
          const overview = root.querySelector("[data-overview]")
          if (overview) {
            const words = overview.querySelectorAll("[data-ow]")
            gsap.fromTo(
              words,
              { color: GHOST },
              { color: INK, ease: "none", stagger: 0.02, scrollTrigger: { trigger: overview, start: "top 80%", end: "bottom 55%", scrub: true } },
            )
          }

          // 5. Challenge / approach cards straighten in
          root.querySelectorAll<HTMLElement>("[data-tilt-card]").forEach((card, i) => {
            gsap.fromTo(
              card,
              { rotate: mobile ? 0 : i % 2 ? 4 : -4, y: 60, autoAlpha: 0, transformOrigin: "bottom center" },
              { rotate: 0, y: 0, autoAlpha: 1, ease: "power3.out", force3D: true, scrollTrigger: { trigger: card, start: "top 95%", end: "top 55%", scrub: true } },
            )
          })

          // 6. Features
          root.querySelectorAll<HTMLElement>("[data-feature]").forEach((row) => {
            const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: "top 85%", once: true } })
            tl.fromTo(row.querySelector("[data-line]"), { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 0.9, ease: "power3.inOut" })
            tl.fromTo(row.querySelectorAll("[data-ft]"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.1 }, "-=0.5")
            const img = row.querySelector("[data-feature-img]")
            if (img) tl.fromTo(img, { clipPath: "inset(0 100% 0 0 round 24px)" }, { clipPath: "inset(0 0% 0 0 round 24px)", duration: 1.1, ease: "expo.out" }, "-=0.7")
          })

          // 7. Design system
          const design = root.querySelector("[data-design]")
          if (design) {
            gsap.fromTo(
              design.querySelectorAll("[data-swatch]"),
              { autoAlpha: 0, scale: 0.9, y: 20 },
              { autoAlpha: 1, scale: 1, y: 0, duration: 0.7, ease: "back.out(1.6)", stagger: 0.06, force3D: true, scrollTrigger: { trigger: design, start: "top 85%", once: true } },
            )
            fadeUp(design.querySelectorAll("[data-design-block]"), design, { stagger: 0.1 })
          }

          // 8. Gallery stacking (desktop) / fade-up (mobile)
          const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-grow]"))
          rows.forEach((row, i) => {
            if (mobile) {
              fadeUp(row, row)
              return
            }
            const nextRow = rows[i + 1]
            if (!nextRow) return
            gsap.fromTo(
              row.querySelector("[data-gcard]"),
              { scale: 1, transformOrigin: "center top" },
              { scale: 0.92, ease: "none", force3D: true, scrollTrigger: { trigger: nextRow, start: "top bottom", end: `top ${stickyTop(i + 1)}px`, scrub: true } },
            )
          })

          // 9–11. Remaining blocks
          root.querySelectorAll<HTMLElement>("[data-fade-block]").forEach((el) => fadeUp(el.querySelectorAll("[data-fade]"), el, { stagger: 0.08 }))
        },
      )

      document.fonts.ready.then(refresh)
      return () => mm.revert()
    },
    { scope: rootRef },
  )

  return (
    <main ref={rootRef} className="bg-bg">
      {/* 1. Header */}
      <header className="px-6 pt-12 md:px-10 md:pt-16 lg:px-14">
        <div className="flex items-center justify-between gap-6 text-[14px]">
          <Link href="/work" className="inline-flex items-center gap-2 font-medium transition-colors duration-300 hover:text-primary">
            ← All work
          </Link>
          <p className="text-muted">
            <Link href="/work" className="transition-colors duration-300 hover:text-ink">
              Work
            </Link>{" "}
            / <span className="text-ink">{project.title}</span>
          </p>
        </div>

        <div className="mt-16 grid grid-cols-12 items-end gap-x-6 gap-y-10 md:mt-24">
          <div className="col-span-12 lg:col-span-9">
            <Label className="mb-8">{project.category}</Label>
            <h1 data-title className="text-[clamp(56px,10vw,160px)] leading-[0.95] font-medium tracking-[-0.04em]">
              {project.title.split(" ").map((w, i) => (
                <Word key={i} className="mr-[0.22em]">
                  {w}
                </Word>
              ))}
            </h1>
            {project.subtitle && (
              <p data-header-fade className="mt-6 text-[clamp(20px,2.4vw,32px)] leading-[1.3] text-muted">
                {project.subtitle}
              </p>
            )}
            {has(project.projectType) && (
              <span data-header-fade className="mt-6 inline-block rounded-full bg-peach px-3.5 py-1.5 text-[13px] font-medium">
                {project.projectType}
              </span>
            )}
          </div>
          {hasUrl && (
            <div data-header-fade className="col-span-12 lg:col-span-3 lg:justify-self-end">
              <MagneticButton href={project.url} target="_blank" rel="noopener noreferrer">
                Visit site
              </MagneticButton>
            </div>
          )}
        </div>
      </header>

      {/* 2. Meta row */}
      <section data-meta className="mx-6 mt-16 grid grid-cols-1 gap-x-6 gap-y-8 border-y border-line py-10 sm:grid-cols-2 md:mx-10 md:mt-20 lg:mx-14 lg:grid-cols-4">
        {project.tags.length > 0 && <MetaCol label="Role" values={project.tags} />}
        {has(project.year) && <MetaCol label="Year" values={[project.year]} />}
        {has(project.duration) && <MetaCol label="Duration" values={[project.duration]} />}
        {project.tools.length > 0 && <MetaCol label="Tools" values={project.tools} />}
      </section>

      {/* 3. Cover */}
      <section className="px-6 pt-16 md:px-10 md:pt-20 lg:px-14">
        <div data-cover className="relative aspect-[16/10] overflow-hidden rounded-[36px] bg-surface [transform:translateZ(0)]">
          <div data-cover-img className="absolute inset-0 scale-[1.16] will-change-transform">
            {project.image ? (
              <Image src={project.image} alt={`${project.title} cover`} fill priority sizes="100vw" className="object-cover" onLoad={refresh} />
            ) : (
              <div className="flex size-full items-center justify-center">
                <span className="text-[clamp(120px,24vw,360px)] leading-none font-semibold tracking-[-0.05em] text-line select-none">
                  {project.title.slice(0, 2)}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Overview */}
      {has(project.overview) && (
        <section data-overview className="grid grid-cols-12 gap-x-6 gap-y-8 px-6 py-24 md:px-10 md:py-32 lg:px-14 lg:py-40">
          <div className="col-span-12 lg:col-span-3">
            <Label className="lg:sticky lg:top-28">Overview</Label>
          </div>
          <p className="col-span-12 text-[clamp(24px,2.6vw,40px)] leading-[1.3] font-medium tracking-[-0.02em] lg:col-span-9">
            {project.overview.split(" ").map((w, i) => (
              <span key={i}>
                <span data-ow className="inline-block">
                  {w}
                </span>{" "}
              </span>
            ))}
          </p>
        </section>
      )}

      {/* 5. Challenge & approach */}
      {showChallenge && (
        <section className="grid grid-cols-1 gap-6 px-6 pb-24 md:px-10 md:pb-32 lg:grid-cols-2 lg:px-14 lg:pb-40 [perspective:1200px]">
          {has(project.challenge) && <TiltCard n="01" title="The Challenge" text={project.challenge} />}
          {has(project.approach) && <TiltCard n="02" title="My Approach" text={project.approach} />}
        </section>
      )}

      {/* 6. Key features */}
      {project.features.length > 0 && (
        <section className="px-6 pb-24 md:px-10 md:pb-32 lg:px-14 lg:pb-40">
          <Label className="mb-6">Key Features</Label>
          <h2 className="mb-16 text-[clamp(32px,3.6vw,56px)] leading-[1.08] font-medium tracking-[-0.03em]">What makes it work.</h2>
          <ol>
            {project.features.map((f, i) => {
              const imgRight = i % 2 === 0
              return (
                <li key={i} data-feature className="relative">
                  <span data-line aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-line" />
                  <div className={`grid grid-cols-12 gap-x-6 gap-y-8 py-10 md:py-14 ${f.image ? "" : "items-start"}`}>
                    <div className={`col-span-12 ${f.image ? "lg:col-span-5" : "lg:col-span-8"} ${f.image && !imgRight ? "lg:order-2" : ""}`}>
                      <span data-ft className="block text-[13px] font-medium text-primary tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 data-ft className="mt-4 text-[clamp(22px,2.2vw,32px)] leading-tight font-medium tracking-[-0.02em]">
                        {f.title}
                      </h3>
                      {f.text && (
                        <p data-ft className="mt-4 max-w-[46ch] text-[16px] leading-[1.6] text-muted">
                          {f.text}
                        </p>
                      )}
                    </div>
                    {f.image && (
                      <div className={`col-span-12 lg:col-span-7 ${!imgRight ? "lg:order-1" : ""}`}>
                        <div data-feature-img className="group relative aspect-[16/10] overflow-hidden rounded-[24px] bg-surface [transform:translateZ(0)]">
                          <Image
                            src={f.image}
                            alt={f.title}
                            fill
                            sizes="(max-width: 1023px) 100vw, 58vw"
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
                            onLoad={refresh}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
          <span aria-hidden="true" className="block h-px w-full bg-line" />
        </section>
      )}

      {/* 7. Design system */}
      {showDesign && (
        <section data-design className="px-6 pb-24 md:px-10 md:pb-32 lg:px-14 lg:pb-40">
          <Label className="mb-12">Design System</Label>
          {colors.length > 0 && (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {colors.map((c) => (
                <Swatch key={c.hex + c.name} name={c.name} hex={c.hex} />
              ))}
            </ul>
          )}
          <div className="mt-16 grid grid-cols-12 gap-x-6 gap-y-10">
            {has(project.designSystem.headingFont) && (
              <div data-design-block className="col-span-12 rounded-[28px] border border-line bg-white p-8 md:col-span-6 md:p-10">
                <p className="text-[12px] font-medium tracking-[0.08em] text-muted uppercase">Typography</p>
                <p className="mt-6 text-[clamp(72px,8vw,128px)] leading-none font-medium tracking-[-0.04em]">Aa</p>
                <p className="mt-4 text-[15px]">
                  <span className="font-medium">{project.designSystem.headingFont}</span> for headings
                </p>
                {has(project.designSystem.bodyFont) && (
                  <p className="mt-2 text-[15px] text-muted">
                    {project.designSystem.bodyFont} for body — The quick brown fox jumps over the lazy dog.
                  </p>
                )}
              </div>
            )}
            {has(project.designSystem.notes) && (
              <div data-design-block className="col-span-12 md:col-span-6">
                <p className="text-[12px] font-medium tracking-[0.08em] text-muted uppercase">Style notes</p>
                <p className="mt-6 max-w-[46ch] text-[clamp(18px,1.6vw,22px)] leading-[1.5]">{project.designSystem.notes}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 8. Gallery */}
      {gallery.length > 0 && (
        <section className="px-6 pb-24 md:px-10 md:pb-32 lg:px-14 lg:pb-40" aria-label="Gallery">
          <Label className="mb-12">Gallery</Label>
          {gallery.map((g, i) => (
            <div key={i} data-grow style={{ top: stickyTop(i) }} className={`relative lg:motion-safe:sticky ${i === gallery.length - 1 ? "" : "mb-[18vh]"}`}>
              <button
                type="button"
                data-gcard
                data-cursor-label="View"
                onClick={() => setLightbox(i)}
                aria-label={`Open image${g.caption ? `: ${g.caption}` : ""}`}
                className="relative block aspect-[16/10] w-full overflow-hidden rounded-[32px] bg-surface will-change-transform [backface-visibility:hidden] [transform:translateZ(0)]"
              >
                <Image src={g.image} alt={g.caption || ""} fill sizes="100vw" className="object-cover" onLoad={refresh} />
                {g.caption && (
                  <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3.5 py-1.5 text-[13px] font-medium backdrop-blur-sm">
                    {g.caption}
                  </span>
                )}
              </button>
            </div>
          ))}
        </section>
      )}
      {lightbox !== null && <Lightbox items={gallery} index={lightbox} onClose={() => setLightbox(null)} onIndex={setLightbox} />}

      {/* 9. Outcome & skills */}
      {showOutcome && (
        <section data-fade-block className="grid grid-cols-12 gap-x-6 gap-y-12 border-t border-line px-6 py-24 md:px-10 md:py-32 lg:px-14 lg:py-40">
          {has(project.outcome) && (
            <div data-fade className="col-span-12 lg:col-span-6">
              <Label className="mb-8">Outcome</Label>
              <p className="max-w-[46ch] text-[clamp(20px,2vw,28px)] leading-[1.4] font-medium tracking-[-0.02em]">{project.outcome}</p>
            </div>
          )}
          {project.skillsShown.length > 0 && (
            <div data-fade className="col-span-12 lg:col-span-6">
              <Label className="mb-8">What this project shows</Label>
              <ul className="flex flex-wrap gap-2">
                {project.skillsShown.map((s) => (
                  <li key={s} className="rounded-full bg-peach px-4 py-2 text-[14px] font-medium">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* 10. Visit CTA */}
      {hasUrl && (
        <section data-fade-block className="border-t border-line px-6 py-24 text-center md:px-10 md:py-32 lg:px-14 lg:py-40">
          <h2 data-fade className="text-[clamp(40px,6vw,96px)] leading-[1.02] font-medium tracking-[-0.03em]">
            See it live.
          </h2>
          <div data-fade className="mt-10 flex justify-center">
            <MagneticButton href={project.url} target="_blank" rel="noopener noreferrer">
              Visit site
            </MagneticButton>
          </div>
          <p data-fade className="mt-5 text-[14px] text-muted">
            {domain(project.url)}
          </p>
        </section>
      )}

      {/* 11. Next project */}
      {next && (
        <section className="border-t border-line">
          <Link
            href={`/work/${next.slug}`}
            data-cursor-label="Next Project"
            className="group grid grid-cols-12 items-center gap-x-6 gap-y-8 px-6 py-20 md:px-10 md:py-28 lg:px-14"
          >
            <div className="col-span-12 lg:col-span-8">
              <p className="mb-6 text-[13px] font-medium tracking-[0.08em] text-muted uppercase">Next project</p>
              <p className="flex items-center gap-6 text-[clamp(40px,7vw,120px)] leading-[0.98] font-medium tracking-[-0.04em] transition-transform duration-500 ease-out group-hover:translate-x-3 motion-reduce:transition-none">
                {next.title}
                <svg width="0.5em" height="0.5em" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-primary transition-transform duration-500 ease-out group-hover:translate-x-2 motion-reduce:transition-none">
                  <path d="M3 12h18M13 4l8 8-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </p>
              <p className="mt-5 text-[16px] text-muted">{next.category}</p>
            </div>
            <div className="col-span-12 lg:col-span-4">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[24px] bg-surface [transform:translateZ(0)]">
                {next.image ? (
                  <Image src={next.image} alt="" fill sizes="(max-width: 1023px) 100vw, 33vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none" />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <span className="text-[22px] font-medium text-muted">{next.title}</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
          {prev && prev.slug !== next.slug && (
            <div className="border-t border-line px-6 py-6 md:px-10 lg:px-14">
              <Link href={`/work/${prev.slug}`} className="text-[14px] text-muted transition-colors duration-300 hover:text-ink">
                ← Previous: {prev.title}
              </Link>
            </div>
          )}
        </section>
      )}
    </main>
  )
}

/* ------------------------------------------------------------------ */

function MetaCol({ label, values }: { label: string; values: string[] }) {
  return (
    <div data-meta-col>
      <p className="text-[12px] font-medium tracking-[0.08em] text-muted uppercase">{label}</p>
      <p className="mt-3 text-[15px] leading-[1.6]">{values.join(", ")}</p>
    </div>
  )
}

function TiltCard({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <article data-tilt-card className="rounded-[28px] border border-line bg-white p-8 will-change-transform [backface-visibility:hidden] md:p-12">
      <span className="text-[13px] font-medium text-primary tabular-nums">{n}</span>
      <h2 className="mt-4 text-[clamp(24px,2.4vw,36px)] leading-tight font-medium tracking-[-0.02em]">{title}</h2>
      <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.6] text-muted">{text}</p>
    </article>
  )
}

function Swatch({ name, hex }: { name: string; hex: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(hex)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {}
  }
  return (
    <li data-swatch>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${name} ${hex}`}
        className="group block w-full text-left transition-transform duration-300 ease-out hover:-translate-y-1.5 motion-reduce:transition-none"
      >
        <span className="block aspect-[4/5] w-full rounded-[20px] border border-line" style={{ backgroundColor: hex }} />
        <span className="mt-3 block text-[14px] font-medium">{name}</span>
        <span className="block text-[13px] text-muted tabular-nums">{copied ? "Copied" : hex.toUpperCase()}</span>
      </button>
    </li>
  )
}
