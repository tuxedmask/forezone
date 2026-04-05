import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#05070f] text-white">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_left,rgba(16,185,129,0.16),transparent_30%),linear-gradient(to_bottom,rgba(5,7,15,0.50),rgba(5,7,15,0.94))]" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
            <div>
              <div className="mb-5 inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
                Fore Zone • Soccer First
              </div>

              <h1 className="max-w-4xl text-5xl font-black uppercase tracking-tight sm:text-6xl lg:text-7xl">
                Welcome to
                <span className="block bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  Soccer Zone
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
                Make your matchweek predictions, track your best plays, and
                follow daily action across league fixtures. Fore Zone is built
                to let you submit clean, confident picks in one premium
                experience.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
                  League
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
                  Match
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
                  Pick
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
                  Odds
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
                  Book
                </span>
              </div>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/soccer"
                  className="rounded-2xl bg-white px-8 py-4 text-base font-semibold text-black transition hover:scale-[1.02]"
                >
                  Enter Soccer Zone
                </Link>

                <Link
                  href="/nba"
                  className="rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-base font-semibold text-white transition hover:scale-[1.02] hover:bg-white/10"
                >
                  Explore NBA
                </Link>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                    Featured Flow
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    Matchweek Pick Submission
                  </h2>
                </div>

                <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                  Select Days
                </div>
              </div>

              <p className="text-sm leading-6 text-white/65">
                On featured slates, users can submit their prediction form and
                lock in a play with the key details needed for tracking and
                grading.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  "Choose the league",
                  "Select the match",
                  "Enter your pick",
                  "Add the odds",
                  "Add the sportsbook",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-bold text-emerald-200">
                      ✓
                    </div>
                    <span className="text-sm font-medium text-white/85">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-cyan-400/10 bg-cyan-400/5 px-4 py-4">
                <p className="text-sm text-cyan-100/85">
                  This section can later connect to your daily form flow for
                  community pick submissions.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 grid gap-5 lg:grid-cols-2">
            <Link
              href="/soccer"
              className="rounded-[28px] border border-emerald-300/15 bg-white/5 p-6 transition hover:border-emerald-300/30 hover:bg-white/[0.08]"
            >
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
                Soccer Zone
              </div>
              <h3 className="mt-3 text-3xl font-bold text-white">
                Matchweek predictions
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
                Enter the soccer section to view fixtures, build predictions,
                and track your matchday activity in one place.
              </p>
            </Link>

            <Link
              href="/nba"
              className="rounded-[28px] border border-indigo-300/15 bg-white/5 p-6 transition hover:border-indigo-300/30 hover:bg-white/[0.08]"
            >
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-200">
                NBA Zone
              </div>
              <h3 className="mt-3 text-3xl font-bold text-white">
                Hoops section
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
                Keep NBA as the second section with its own slate, submissions,
                and tracking flow once the soccer side is in place.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}