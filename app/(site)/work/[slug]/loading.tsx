export default function ProjectLoading() {
  const bar = "animate-pulse rounded-full bg-surface"
  return (
    <main aria-busy="true" className="bg-bg px-6 md:px-10 lg:px-14">
      <div className="pt-16 md:pt-24">
        <div className={`${bar} h-4 w-24`} />
        <div className={`${bar} mt-8 h-[clamp(56px,10vw,160px)] w-3/4`} />
        <div className={`${bar} mt-6 h-6 w-1/3`} />
        <div className="mt-16 grid grid-cols-2 gap-6 border-y border-line py-8 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i}>
              <div className={`${bar} h-3 w-14`} />
              <div className={`${bar} mt-3 h-4 w-28`} />
            </div>
          ))}
        </div>
        <div className={`${bar} mt-16 aspect-[16/10] w-full rounded-[36px]`} />
      </div>
    </main>
  )
}
