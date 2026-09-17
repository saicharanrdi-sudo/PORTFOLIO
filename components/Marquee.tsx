"use client"

import { useContent } from "./ContentProvider"

function Track({ items, hidden = false }: { items: string[]; hidden?: boolean }) {
  return (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((skill) => (
        <li key={skill} className="flex items-center gap-8 pr-8 text-[15px] whitespace-nowrap">
          <span>{skill}</span>
          <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
        </li>
      ))}
    </ul>
  )
}

/** Slow, infinite skills ticker. Pauses on hover. Second track is a hidden duplicate for the seamless loop. */
export default function Marquee() {
  const { hero } = useContent()
  return (
    <div
      aria-label="Skills"
      className="group overflow-hidden py-5"
      style={{ maskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)" }}
    >
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
        <Track items={hero.marquee} />
        <Track items={hero.marquee} hidden />
      </div>
    </div>
  )
}
