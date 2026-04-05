import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#05070f] text-white">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-[url('/sports-hero.jpg')] bg-cover bg-center opacity-35" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.22),transparent_35%),linear-gradient(to_bottom,rgba(5,7,15,0.55),rgba(5,7,15,0.92))]" />

        <div className="relative mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
            Multi-Sport Picks Platform
          </div>

          <h1 className="max-w-5xl text-5xl font-black uppercase tracking-tight sm:text-6xl lg:text-7xl">
            Pick. Track. Win.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
            Fore Zone brings NBA and Soccer into one clean, premium experience.
            Choose your section, make your picks, and build your record.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/nba"
              className="rounded-2xl bg-white px-8 py-4 text-base font-semibold text-black transition hover:scale-[1.02]"
            >
              Enter NBA
            </Link>

            <Link
              href="/soccer"
              className="rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-base font-semibold text-white transition hover:scale-[1.02] hover:bg-white/10"
            >
              Enter Soccer
            </Link>
          </div>

          <div className="mt-16 grid w-full max-w-5xl gap-5 lg:grid-cols-2">
            <Link
              href="/nba"
              className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-left backdrop-blur-md transition hover:border-cyan-300/30 hover:bg-white/[0.08]"
            >
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
                NBA
              </div>
              <h2 className="mt-3 text-3xl font-bold">Daily hoops picks</h2>
              <p className="mt-3 text-sm leading-6 text-white/65">
                View today’s slate, submit your NBA pick, and track your results.
              </p>
            </Link>

            <Link
              href="/soccer"
              className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-left backdrop-blur-md transition hover:border-emerald-300/30 hover:bg-white/[0.08]"
            >
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
                Soccer
              </div>
              <h2 className="mt-3 text-3xl font-bold">Matchday picks</h2>
              <p className="mt-3 text-sm leading-6 text-white/65">
                Jump into soccer fixtures, make picks, and follow your record.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}