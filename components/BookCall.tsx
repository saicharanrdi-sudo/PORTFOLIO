"use client"

import { useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import gsap from "gsap"
import MagneticButton from "./MagneticButton"
import { lockScroll } from "@/lib/lenis"
import { useContent } from "./ContentProvider"

const CATEGORIES = [
  "Product Design",
  "UI/UX Design",
  "Interactive Website",
  "Freelance Project",
  "Full-time Role",
  "Other",
]

const ENDPOINT = "https://api.web3forms.com/submit"
const ACCESS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'

/* ------------------------------------------------------------------ */
/* Trigger                                                             */
/* ------------------------------------------------------------------ */

export default function BookCallButton() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLElement>(null)

  const close = () => {
    setOpen(false)
    // Return focus to where the user was
    triggerRef.current?.focus()
  }

  return (
    <>
      <MagneticButton ref={triggerRef} onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>
        Book a call
      </MagneticButton>
      {open && <BookCallModal onClose={close} />}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

type Status = "idle" | "sending" | "error" | "success"
type Values = { name: string; category: string; email: string }
type Errors = Partial<Record<keyof Values, string>>

function BookCallModal({ onClose }: { onClose: () => void }) {
  const { site } = useContent()
  const EMAIL = site.email
  const BOOKING_URL = site.bookingUrl
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const titleId = useId()
  const reduce = useRef(false)

  const [values, setValues] = useState<Values>({ name: "", category: "", email: "" })
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<Status>("idle")
  const closing = useRef(false)

  // ---- Open: lock scroll, animate in, focus first field ----
  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    lockScroll(true)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const overlay = overlayRef.current!
    const panel = panelRef.current!
    const focusFirst = () => nameRef.current?.focus()
    const ctx = gsap.context(() => {
      if (reduce.current) {
        gsap.set([overlay, panel, "[data-field]"], { autoAlpha: 1 })
        focusFirst()
        return
      }
      // Focus once the fields are actually visible; a hidden input ignores focus()
      gsap
        .timeline({ onComplete: focusFirst })
        .fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: "power2.out" })
        .fromTo(
          panel,
          { autoAlpha: 0, y: 40, scale: 0.96 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" },
          "-=0.2",
        )
        .fromTo(
          "[data-field]",
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.06 },
          "-=0.35",
        )
    }, panel)

    return () => {
      ctx.revert()
      document.body.style.overflow = prevOverflow
      lockScroll(false)
    }
  }, [])

  // ---- Close with reverse animation ----
  const requestClose = () => {
    if (closing.current) return
    closing.current = true
    if (reduce.current) return onClose()
    gsap
      .timeline({ onComplete: onClose })
      .to(panelRef.current, { autoAlpha: 0, y: 20, scale: 0.98, duration: 0.3, ease: "power2.in" })
      .to(overlayRef.current, { autoAlpha: 0, duration: 0.25 }, "-=0.15")
  }

  // ---- Esc + focus trap ----
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault()
      requestClose()
      return
    }
    if (e.key !== "Tab" || !panelRef.current) return
    const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null,
    )
    if (!nodes.length) return
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

  // ---- Validation ----
  const validate = (): Errors => {
    const next: Errors = {}
    if (values.name.trim().length < 2) next.name = "Please tell me your name."
    if (!values.category) next.category = "Pick the option that fits best."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = "That email doesn't look right."
    return next
  }

  const shake = (name: keyof Values) => {
    const el = panelRef.current?.querySelector(`[data-field="${name}"]`)
    if (!el || reduce.current) return
    gsap.fromTo(el, { x: 0 }, { keyframes: [{ x: -6 }, { x: 6 }, { x: -4 }, { x: 4 }, { x: 0 }], duration: 0.4, ease: "power1.inOut" })
  }

  // ---- Submit ----
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const next = validate()
    setErrors(next)
    const keys = Object.keys(next) as Array<keyof Values>
    if (keys.length) {
      keys.forEach(shake)
      panelRef.current?.querySelector<HTMLElement>(`[data-field="${keys[0]}"] input`)?.focus()
      return
    }

    const form = e.currentTarget
    const botcheck = (form.elements.namedItem("botcheck") as HTMLInputElement | null)?.checked ?? false
    if (botcheck) {
      // Honeypot tripped: pretend it worked, send nothing
      setStatus("success")
      return
    }
    if (!ACCESS_KEY) {
      setStatus("error")
      return
    }

    setStatus("sending")
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject: `New project inquiry from ${values.name.trim()}`,
          from_name: "Portfolio",
          name: values.name.trim(),
          email: values.email.trim(),
          category: values.category,
          botcheck: false,
        }),
      })
      const data = (await res.json()) as { success?: boolean }
      setStatus(data.success ? "success" : "error")
    } catch {
      setStatus("error")
    }
  }

  const set = (key: keyof Values) => (v: string) => {
    setValues((s) => ({ ...s, [key]: v }))
    if (errors[key]) setErrors((s) => ({ ...s, [key]: undefined }))
  }

  const firstName = values.name.trim().split(/\s+/)[0]

  return createPortal(
    <div
      ref={overlayRef}
      onMouseDown={(e) => e.target === overlayRef.current && requestClose()}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center sm:p-6"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-[576px] rounded-3xl bg-bg p-7 shadow-[0_40px_120px_-20px_rgba(17,17,17,0.35)] sm:p-12"
      >
        <button
          type="button"
          onClick={requestClose}
          aria-label="Close"
          className="absolute top-5 right-5 flex size-10 items-center justify-center rounded-full text-ink transition-colors duration-300 hover:bg-surface sm:top-6 sm:right-6"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
          </svg>
        </button>

        {status === "success" ? (
          <SuccessState firstName={firstName} onClose={requestClose} reduce={reduce.current} titleId={titleId} bookingUrl={BOOKING_URL} />
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <p data-field className="mb-4 flex items-center gap-3 text-[13px] font-medium tracking-[0.08em] uppercase">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
              Book a call
            </p>
            <h2 id={titleId} data-field className="text-[clamp(26px,3vw,36px)] leading-[1.1] font-medium tracking-[-0.03em]">
              Tell me a little about your project.
            </h2>

            {/* Honeypot: hidden from people, tempting to bots */}
            <input type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

            <Field name="name" label="Your name" error={errors.name}>
              <input
                ref={nameRef}
                id="bc-name"
                name="name"
                type="text"
                autoComplete="name"
                value={values.name}
                onChange={(e) => set("name")(e.target.value)}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "bc-name-error" : undefined}
                className={inputClass}
              />
            </Field>

            <fieldset data-field="category" className="mt-9">
              <legend className="mb-4 text-[13px] font-medium text-muted">What is it about?</legend>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <label key={c} className="cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value={c}
                      checked={values.category === c}
                      onChange={() => set("category")(c)}
                      className="peer sr-only"
                    />
                    <span className="inline-block rounded-full border border-line bg-white px-4 py-2 text-[14px] transition-[background-color,color,border-color] duration-300 select-none peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink hover:border-ink">
                      {c}
                    </span>
                  </label>
                ))}
              </div>
              {errors.category && (
                <p role="alert" className="mt-3 text-[13px] text-primary">
                  {errors.category}
                </p>
              )}
            </fieldset>

            <Field name="email" label="Email" error={errors.email}>
              <input
                id="bc-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={values.email}
                onChange={(e) => set("email")(e.target.value)}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "bc-email-error" : undefined}
                className={inputClass}
              />
            </Field>

            {status === "error" && (
              <p role="alert" data-field className="mt-8 rounded-2xl bg-peach px-5 py-4 text-[14px] leading-[1.5]">
                Something went wrong sending this. You can email me directly at{" "}
                <a href={`mailto:${EMAIL}`} className="font-medium underline underline-offset-4">
                  {EMAIL}
                </a>
                .
              </p>
            )}

            <div data-field className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <button
                type="submit"
                disabled={status === "sending"}
                className="inline-flex items-center gap-2.5 rounded-full bg-primary px-6 py-3.5 text-[15px] font-medium text-white transition-colors duration-300 hover:bg-primary-hover disabled:cursor-wait disabled:opacity-80"
              >
                {status === "sending" ? (
                  <>
                    <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Sending
                  </>
                ) : (
                  "Send request"
                )}
              </button>
              <p className="text-[13px] text-muted">I usually reply within a day.</p>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

const inputClass =
  "w-full border-b border-line bg-transparent py-3 text-[17px] text-ink outline-none transition-colors duration-300 placeholder:text-muted focus:border-primary aria-[invalid=true]:border-primary"

function Field({ name, label, error, children }: { name: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div data-field={name} className="mt-9">
      <label htmlFor={`bc-${name}`} className="mb-1 block text-[13px] font-medium text-muted">
        {label}
      </label>
      {children}
      {error && (
        <p id={`bc-${name}-error`} role="alert" className="mt-2 text-[13px] text-primary">
          {error}
        </p>
      )}
    </div>
  )
}

function SuccessState({
  firstName,
  onClose,
  reduce,
  titleId,
  bookingUrl,
}: {
  firstName: string
  onClose: () => void
  reduce: boolean
  titleId: string
  bookingUrl: string
}) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const ctx = gsap.context(() => {
      if (reduce) return
      gsap
        .timeline()
        .fromTo("[data-ring]", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut" })
        .fromTo("[data-tick]", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.4, ease: "power2.out" }, "-=0.2")
        .fromTo("[data-line]", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.08 }, "-=0.2")
    }, root)
    root.querySelector<HTMLElement>("button")?.focus()
    return () => ctx.revert()
  }, [reduce])

  return (
    <div ref={rootRef} className="flex flex-col items-start">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <circle data-ring cx="32" cy="32" r="30" pathLength="1" strokeDasharray="1" stroke="#FF5B1F" strokeWidth="1.5" />
        <path
          data-tick
          d="M20 33l8 8 16-17"
          pathLength="1"
          strokeDasharray="1"
          stroke="#FF5B1F"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <h2 id={titleId} data-line className="mt-8 text-[clamp(26px,3vw,36px)] leading-[1.1] font-medium tracking-[-0.03em]">
        Thanks{firstName ? `, ${firstName}` : ""}!
      </h2>
      <p data-line className="mt-4 max-w-[38ch] text-[16px] leading-[1.6] text-muted">
        Your request is in. I&rsquo;ll get back to you within a day. If you&rsquo;d rather pick a time now, you can book directly.
      </p>
      <div data-line className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center rounded-full bg-primary px-6 py-3.5 text-[15px] font-medium text-white transition-colors duration-300 hover:bg-primary-hover"
        >
          Close
        </button>
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative inline-block py-1 text-[15px] font-medium after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-out hover:after:origin-left hover:after:scale-x-100"
        >
          Pick a time on Cal.com ↗
        </a>
      </div>
    </div>
  )
}
