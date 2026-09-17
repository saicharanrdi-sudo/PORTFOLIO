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

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [revealed, setRevealed] = useState(false)

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
        <Experience />
        <Quote />
        <Work />
        <MoreWork />
        <Skills />
        <Process />
        <Testimonials />
      </main>
    </>
  )
}
