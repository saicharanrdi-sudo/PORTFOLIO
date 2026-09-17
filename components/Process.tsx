"use client";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { blur } from "@/lib/perf";
import { useContent } from "./ContentProvider";

gsap.registerPlugin(ScrollTrigger);

export default function Process() {
  const { process } = useContent();
  const root = useRef(null);

  useGSAP(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cards = gsap.utils.toArray<HTMLElement>(".process-card");

    cards.forEach((card, i) => {
      if (reduce) return;
      gsap.fromTo(
        card,
        { rotate: i % 2 ? -8 : 8, rotateX: 12, y: 120, scale: 0.92, opacity: 0, filter: blur(6) },
        {
          rotate: 0, rotateX: 0, y: 0, scale: 1, opacity: 1, filter: blur(0),
          ease: "power3.out",
          scrollTrigger: { trigger: card, start: "top 90%", end: "top 45%", scrub: 1 },
        }
      );
    });

    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }, { scope: root });

  return (
    <section ref={root} id="process" className="bg-[#FAFAF7] py-40 px-6 md:px-12">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
        <div className="md:col-span-5 md:sticky md:top-32 self-start">
          <p className="flex items-center gap-2 text-sm text-[#6B6B6B]">
            <span className="w-2 h-2 rounded-full bg-[#FF5B1F]" /> Process
          </p>
          <h2 className="mt-6 text-4xl md:text-6xl font-medium tracking-tight text-[#111]">
            {process.heading}
          </h2>
          <p className="mt-6 text-[#6B6B6B] max-w-md">
            {process.intro}
          </p>
          <a href="#contact" className="inline-block mt-10 bg-[#FF5B1F] text-white px-6 py-3 rounded-full">
            Start a project →
          </a>
        </div>

        <ol className="md:col-start-7 md:col-span-6 flex flex-col gap-12" style={{ perspective: "1200px" }}>
          {process.steps.map((s, i) => (
            <li key={s.title} className="process-card origin-bottom will-change-transform [backface-visibility:hidden] bg-white border border-[#E6E4DF] rounded-3xl p-10 md:p-12 shadow-[0_20px_60px_rgba(17,17,17,0.06)]">
              <span className="text-6xl font-medium text-[#FF5B1F]">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-6 text-3xl font-medium text-[#111]">{s.title}</h3>
              <p className="mt-4 text-[#6B6B6B] text-lg">{s.text}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {s.tags.map((t) => (
                  <span key={t} className="bg-[#FFE8DD] text-[#111] text-sm px-3 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
