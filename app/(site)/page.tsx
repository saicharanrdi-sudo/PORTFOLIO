"use client"

import { useEffect, useState } from "react"
import Preloader from "@/components/Preloader"
import Hero from "@/components/Hero"
import About from "@/components/About"
import Experience from "@/components/Experience"
import Quote from "@/components/Quote"
import Work from "@/components/Work"
import MoreWork from "@/components/MoreWork"
import Skills from "@/components/Skills"
import Process from "@/components/Process"
import Testimonials from "@/components/Testimonials"
import { lockScroll } from "@/lib/lenis"

const SESSION_KEY = "preloader-shown"

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [revealed, setRevealed] = useState(false)

  // The opening plays once per browser session; later visits go straight to the hero
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) {
        setLoading(false)
        setRevealed(true)
        return
      }
      sessionStorage.setItem(SESSION_KEY, "1")
    } catch {
      // storage unavailable (private mode etc.): just play it
    }
  }, [])

  // Scroll stays locked until the preloader has fully lifted
  useEffect(() => {
    document.documentElement.classList.toggle("is-loading", loading)
    lockScroll(loading)
  }, [loading])

  return (
    <>
      {loading && <Preloader onReveal={() => setRevealed(true)} onDone={() => setLoading(false)} />}
      <main>
        <Hero play={revealed} />
        <About />
        <Work />
        <MoreWork />
        <Quote />
        <Experience />
        <Skills />
        <Process />
        <Testimonials />
      </main>
    </>
  )
}
