import Image from "next/image"
import type { Project } from "@/data/projects"

const pad = (n: number) => String(n).padStart(2, "0")

/** One masked line: outer clips, inner slides. */
function Line({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`block overflow-hidden pt-[0.1em] -mt-[0.1em] pb-[0.25em] -mb-[0.25em] ${className}`}>
      <span data-line className="block will-change-transform [backface-visibility:hidden]">
        {children}
      </span>
    </span>
  )
}

export default function ProjectRow({
  project,
  index,
  total,
  top,
  isLast,
}: {
  project: Project
  index: number
  total: number
  top: number
  isLast: boolean
}) {
  const external = project.url.startsWith("http")
  const linkProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {}

  return (
    <div
      data-row
      style={{ top }}
      className={`relative motion-safe:sticky ${isLast ? "" : "mb-[22vh]"}`}
    >
      <article
        data-card
        className="relative grid grid-cols-1 overflow-hidden rounded-[36px] border border-line bg-white will-change-transform [backface-visibility:hidden] [transform:translateZ(0)] lg:h-[calc(100svh-168px)] lg:grid-cols-12"
      >
        {/* Image */}
        <a
          href={project.url}
          {...linkProps}
          data-cursor-label="View Project"
          aria-label={`View ${project.title} project`}
          className="relative order-1 m-3 aspect-[4/3] overflow-hidden rounded-[26px] bg-surface [transform:translateZ(0)] lg:order-2 lg:col-span-8 lg:m-4 lg:aspect-auto lg:h-[calc(100%-32px)]"
        >
          <div data-img className="absolute inset-0 will-change-transform [backface-visibility:hidden]">
            {project.image ? (
              <Image src={project.image} alt="" fill sizes="(max-width: 1023px) 100vw, 66vw" className="object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center">
                <span className="text-[clamp(20px,2vw,32px)] font-medium tracking-[-0.01em] text-muted">{project.title}</span>
              </div>
            )}
          </div>
        </a>

        {/* Info */}
        <div className="order-2 flex flex-col justify-between p-6 lg:order-1 lg:col-span-4 lg:p-10">
          <div>
            <Line className="text-[13px] font-medium text-muted tabular-nums">
              <span className="text-primary">{pad(index + 1)}</span> / {pad(total)}
            </Line>
            <h2 className="mt-6 text-[clamp(32px,4vw,64px)] leading-[1.02] font-medium tracking-[-0.03em]">
              <Line>{project.title}</Line>
            </h2>
            <Line className="mt-3 text-[17px] text-muted">{project.subtitle}</Line>
            <ul className="mt-7 hidden flex-wrap gap-1.5 lg:flex" aria-label="Tags">
              {project.tags.map((t) => (
                <li key={t} className="rounded-full bg-peach px-3 py-1 text-[12px] font-medium">
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex items-center justify-between gap-4 lg:mt-0">
            <span className="text-[14px] text-muted tabular-nums">{project.year}</span>
            <a
              href={project.url}
              {...linkProps}
              className="group inline-flex items-center gap-2.5 rounded-full border border-ink py-2.5 pr-3 pl-5 text-[14px] font-medium transition-colors duration-300 hover:bg-ink hover:text-white motion-reduce:transition-none"
            >
              Visit site
              <span className="flex size-6 items-center justify-center rounded-full bg-ink text-white transition-colors duration-300 group-hover:bg-white group-hover:text-ink">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 10 10 2M4 2h6v6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </a>
          </div>
        </div>

        {/* Darkens as the next card stacks over */}
        <span
          data-shade
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-ink opacity-0 will-change-[opacity] [backface-visibility:hidden]"
        />
      </article>
    </div>
  )
}
