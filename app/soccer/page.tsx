import Link from "next/link";

const leagues = [
  {
    name: "Premier League",
    country: "England",
    href: "/soccer/predictions/premier-league",
    logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Premier%20League.svg",
  },
  {
    name: "Bundesliga",
    country: "Germany",
    href: "/soccer/predictions/bundesliga",
    logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Bundesliga%20logo.svg",
  },
  {
    name: "MLS",
    country: "United States",
    href: "/soccer/predictions/mls",
    logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Major%20League%20Soccer%20logo.svg",
  },
  {
    name: "La Liga",
    country: "Spain",
    href: "/soccer/predictions/la-liga",
    logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/LaLiga%20logo%202023.svg",
  },
  {
    name: "Serie A",
    country: "Italy",
    href: "/soccer/predictions/serie-a",
    logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Serie%20A%20logo%202022.svg",
  },
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
      className="group rounded-[24px] border border-white/10 bg-white/5 p-5 transition duration-300 hover:-translate-y-1 hover:border-emerald-300/30 hover:bg-white/[0.08]"
    >
      <div className="flex min-h-[140px] flex-col justify-between">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 p-2">
          <img
            src={logo}
            alt={name}
            className="h-10 w-10 object-contain"
          />
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-bold text-white">{name}</h3>
          <p className="mt-1 text-sm text-white/60">{country}</p>
        </div>
      </div>
    </Link>
  );
}

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
              predictions by league, submit daily picks, and grow the soccer
              side into a cleaner multi-league hub.
            </p>

            <div className="mt-10">
              <div className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
                Choose a league for matchweek predictions
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {leagues.map((league) => (
                  <LeagueCard key={league.name} {...league} />
                ))}
              </div>
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
              description="Choose a league, open its matchweek page, and build out the predictions flow league by league."
              href="/soccer/predictions"
              buttonLabel="Open Predictions"
              accent="bg-emerald-500/20"
            />

            <FeatureCard
              eyebrow="Daily Action"
              title="Daily Picks"
              description="Keep soccer daily picks separate from matchweek predictions with their own cleaner submission flow."
              href="/soccer/submit"
              buttonLabel="Open Daily Picks"
              accent="bg-cyan-500/20"
            />
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            <div className="rounded-[26px] border border-white/10 bg-white/5 p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                Leagues
              </div>
              <h3 className="mt-3 text-2xl font-bold text-white">
                League-based entry
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/65">
                Let users jump straight into the competition they want instead
                of starting from a generic predictions page.
              </p>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-white/5 p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                Submission Flow
              </div>
              <h3 className="mt-3 text-2xl font-bold text-white">
                Daily picks stay separate
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/65">
                Keep the single-pick flow distinct from the matchweek prediction
                format so the soccer section stays clean.
              </p>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-white/5 p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">
                Expansion
              </div>
              <h3 className="mt-3 text-2xl font-bold text-white">
                Easy to scale
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/65">
                This setup gives you room to add more leagues, more prediction
                pages, and more soccer-specific features later.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}