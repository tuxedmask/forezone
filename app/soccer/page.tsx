import Link from "next/link";

const activeLeagues = [
  {
    name: "Premier League",
    country: "England",
    href: "/soccer/predictions/premier-league",
logo: "https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg",  },
];

function LeagueCard({
  name,
  country,
  href,
  logo,
}: {
  name: string;
  country: string;
  href: string;
  logo: string;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col justify-between rounded-[24px] border border-white/10 bg-white/5 p-5 transition duration-300 hover:-translate-y-1 hover:border-emerald-300/30 hover:bg-white/[0.08]"
    >
     <div className="flex h-[120px] items-center justify-center">
  <div className="relative flex h-[95px] w-[95px] items-center justify-center rounded-3xl border border-white/10 bg-white shadow-[0_0_40px_rgba(16,185,129,0.25)] transition duration-300 group-hover:scale-105">
    
    {/* Glow */}
    <div className="absolute inset-0 rounded-3xl bg-emerald-400/20 blur-xl opacity-70 group-hover:opacity-100" />

    <img
      src={logo}
      alt={name}
      className="relative z-10 h-[60px] w-[60px] object-contain"
    />
  </div>
</div>

      <div className="mt-6 text-center">
        <h3 className="text-lg font-bold text-white">{name}</h3>
        <p className="mt-1 text-sm text-white/60">{country}</p>
      </div>
    </Link>
  );
}

function ComingSoonCard() {
  return (
    <div className="relative flex h-full flex-col justify-between rounded-[24px] border border-white/10 bg-white/[0.04] p-5 opacity-75">
      <div className="absolute right-4 top-4 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200">
        Coming Soon
      </div>

     <div className="flex h-[120px] items-center justify-center">
  <div className="relative flex h-[95px] w-[95px] items-center justify-center rounded-3xl border border-white/10 bg-white shadow-[0_0_40px_rgba(245,158,11,0.25)]">
    
    {/* Gold glow */}
    <div className="absolute inset-0 rounded-3xl bg-amber-400/20 blur-xl" />

    <img
      src="https://www.citypng.com/public/uploads/preview/hd-real-fifa-world-cup-trophy-png-704081695122858xyxiakairr.png"
      alt="World Cup Trophy"
      className="relative z-10 h-[60px] w-[60px] object-contain"
    />
  </div>
</div>

      <div className="mt-6 text-center">
        <h3 className="text-lg font-bold text-white">World Cup 2026</h3>
        <p className="mt-1 text-sm text-white/60">International</p>
      </div>
    </div>
  );
}

function ActionCard({
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
    <div className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07] sm:p-8">
      <div
        className={`absolute inset-0 opacity-0 blur-3xl transition duration-300 group-hover:opacity-100 ${accent}`}
      />

      <div className="relative z-10 flex h-full min-h-[250px] flex-col justify-between">
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

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
              Fore Zone • Soccer
            </div>

            <h1 className="mt-5 text-5xl font-black uppercase tracking-tight sm:text-6xl lg:text-7xl">
              Soccer Zone
            </h1>

            <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-white/70 sm:text-lg">
              Your soccer hub for matchweek predictions and leaderboard
              competition. Pick a league, build your card, and climb the board
              as matches get graded.
            </p>
          </div>

          <div className="mt-12">
            <div className="mb-4 text-center text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
              Choose a league
            </div>

            <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
              {activeLeagues.map((league) => (
                <LeagueCard key={league.name} {...league} />
              ))}
              <ComingSoonCard />
            </div>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <ActionCard
              eyebrow="Main Competition"
              title="Predictions"
              description="Open Premier League, enter your scorelines, and build out your full matchweek card."
              href="/soccer/predictions/premier-league"
              buttonLabel="Open Predictions"
              accent="bg-emerald-500/20"
            />

            <ActionCard
              eyebrow="Standings"
              title="Leaderboard"
              description="Track weekly and all-time performance, total points, and correct score hits."
              href="/soccer/leaderboard"
              buttonLabel="Open Leaderboard"
              accent="bg-indigo-500/20"
            />
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                League First
              </div>
              <h3 className="mt-3 text-2xl font-bold text-white">
                Start from the main competition
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/65">
                Keep the flow simple by focusing users on the main active soccer
                mode first.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/5 p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                Cleaner Structure
              </div>
              <h3 className="mt-3 text-2xl font-bold text-white">
                Fewer choices, better focus
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/65">
                Hiding the extra leagues for now keeps the landing page cleaner
                and easier to understand.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/5 p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">
                Ready to Grow
              </div>
              <h3 className="mt-3 text-2xl font-bold text-white">
                World Cup next
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/65">
                The layout is ready for future competition launches without
                crowding the page today.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}