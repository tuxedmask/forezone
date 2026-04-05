import Link from "next/link";

function FeatureCard({
  eyebrow,
  title,
  description,
  href,
  buttonLabel,
  accent,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
  accent: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07] sm:p-8">
      <div
        className={`absolute inset-0 opacity-0 blur-3xl transition duration-300 group-hover:opacity-100 ${accent}`}
      />

      <div className="relative z-10 flex h-full min-h-[320px] flex-col justify-between">
        <div>
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            {eyebrow}
          </div>

          <h2 className="mt-5 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
            {title}
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
            {description}
          </p>
        </div>

        <div className="mt-10">
          <Link
            href={href}
            className="inline-flex rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
          >
            {buttonLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SoccerPage() {
  return (
    <main className="min-h-screen bg-[#05070f] text-white">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_24%),linear-gradient(to_bottom,rgba(5,7,15,0.25),rgba(5,7,15,0.96))]" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-4xl">
            <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
              Fore Zone • Soccer Zone
            </div>

            <h1 className="mt-6 text-5xl font-black uppercase tracking-tight sm:text-6xl lg:text-7xl">
              Soccer Zone
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
              Welcome to the soccer side of Fore Zone. Build matchweek
              predictions, submit daily picks, and track your action across
              leagues, matches, odds, and books in one clean hub.
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
                href="/soccer/predictions"
                className="rounded-2xl bg-white px-8 py-4 text-base font-semibold text-black transition hover:scale-[1.02]"
              >
                Matchweek Predictions
              </Link>

              <Link
                href="/soccer/submit"
                className="rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-base font-semibold text-white transition hover:scale-[1.02] hover:bg-white/10"
              >
                Daily Picks
              </Link>
            </div>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            <FeatureCard
              eyebrow="Main Competition"
              title="Matchweek Predictions"
              description="Enter your predictions for featured matchweeks and follow a more structured competition flow. This section is built for slate-style picks across multiple fixtures."
              href="/soccer/predictions"
              buttonLabel="Open Predictions"
              accent="bg-emerald-500/20"
            />

            <FeatureCard
              eyebrow="Daily Action"
              title="Daily Picks"
              description="Submit your daily soccer play with the key details that matter: league, match, pick, odds, and book. Track performance in a cleaner day-by-day format."
              href="/soccer/submit"
              buttonLabel="Open Daily Picks"
              accent="bg-cyan-500/20"
            />
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            <div className="rounded-[26px] border border-white/10 bg-white/5 p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                Competitions
              </div>
              <h3 className="mt-3 text-2xl font-bold text-white">
                Matchweek format
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/65">
                Run featured prediction rounds on selected slates and build a
                more community-driven soccer experience.
              </p>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-white/5 p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                Submission Flow
              </div>
              <h3 className="mt-3 text-2xl font-bold text-white">
                Clean pick entry
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/65">
                Keep daily submissions simple with a clear structure for league,
                match, pick, odds, and sportsbook.
              </p>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-white/5 p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">
                Growth
              </div>
              <h3 className="mt-3 text-2xl font-bold text-white">
                More leagues later
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/65">
                This hub gives you room to expand into more leagues, more
                featured slates, and more soccer-focused tracking over time.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}