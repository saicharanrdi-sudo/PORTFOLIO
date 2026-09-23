import Link from "next/link"

export default function ProjectNotFound() {
  return (
    <main className="flex min-h-svh flex-col items-start justify-center bg-bg px-6 md:px-10 lg:px-14">
      <p className="mb-6 flex items-center gap-3 text-[13px] font-medium tracking-[0.08em] uppercase">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
        404
      </p>
      <h1 className="text-[clamp(40px,6vw,96px)] leading-[1.02] font-medium tracking-[-0.03em]">Project not found.</h1>
      <Link
        href="/work"
        className="mt-10 inline-flex items-center gap-2.5 rounded-full bg-primary px-6 py-3.5 text-[15px] font-medium text-white transition-colors duration-300 hover:bg-primary-hover"
      >
        ← Back to all work
      </Link>
    </main>
  )
}
