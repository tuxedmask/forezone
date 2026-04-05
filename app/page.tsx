import Link from "next/link";

function SportCard({
  title,
  subtitle,
  description,
  href,
  accent,
  badge,
}: {
  title: string;
  subtitle: string;
  description: string;
  href: string;
  accent: string;
  badge: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
    >
      <div
        className={`absolute inset-0 opacity-0 blur-3xl transition duration-300 group-hover:opacity-100 ${accent}`}
      />

      <div className="relative z-10 flex h-full min-h-[320px] flex-col justify-between">
        <div>
          <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            {badge}
          </div>

          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {title}
          </h2>

          <p className="mt-3 text-sm font-medium text-indigo-300">{subtitle}</p>

          <p className="mt-5 max-w-md text-sm leading-6 text-white/65 sm:text-base">
            {description}
          </p>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <div className="grid grid-cols-2 gap-3 text-sm text-white/70">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <div className="text-lg font-semibold text-white">Slate</div>
              <div className="text-xs text-white/50">Today’s matchups</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <div className="text-lg font-semibold text-white">Picks</div>
              <div className="text-xs text-white/50">Submit & track</div>
            </div>
          </div>

          <div className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition group-hover:scale-105">
            Enter
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#070914] text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_22%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.10),transparent_24%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-200">
              Multi-Sport Picks Platform
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Make your daily picks across
              <span className="bg-gradient-to-r from-indigo-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                {" "}
                NBA and Soccer
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
              Fore Zone is becoming a cleaner multi-sport experience. Jump into
              your league, view today’s slate, submit picks, and track your
              record in one premium-style dashboard.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <SportCard
              title="NBA"
              subtitle="Daily hoops picks, leaderboards, and recent plays"
              description="Enter the NBA section to view the slate, submit a pick, check the leaderboard, and follow today’s community action."
              href="/nba"
              badge="Basketball"
              accent="bg-indigo-500/20"
            />

            <SportCard
              title="Soccer"
              subtitle="Matchday picks, fixtures, and soccer-specific tracking"
              description="Step into the Soccer section for fixtures, picks, records, and a more focused experience built for matchday action."
              href="/soccer"
              badge="Football"
              accent="bg-emerald-500/20"
            />
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-white/50">Sections</div>
              <div className="mt-2 text-2xl font-semibold text-white">2 Sports</div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-white/50">Experience</div>
              <div className="mt-2 text-2xl font-semibold text-white">Cleaner UI</div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-white/50">Goal</div>
              <div className="mt-2 text-2xl font-semibold text-white">Premium Feel</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}