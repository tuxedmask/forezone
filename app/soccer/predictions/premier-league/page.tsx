"use client";

import { useMemo, useState } from "react";

type Match = {
  id: number;
  home: string;
  away: string;
  kickoff: string;
  homeLogo: string;
  awayLogo: string;
};

type ScorePick = {
  homeScore: string;
  awayScore: string;
};

const matches: Match[] = [
  {
    id: 1,
    home: "Arsenal",
    away: "Chelsea",
    kickoff: "Sat • 12:30 PM",
    homeLogo: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg",
    awayLogo: "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg",
  },
  {
    id: 2,
    home: "Liverpool",
    away: "Tottenham",
    kickoff: "Sat • 3:00 PM",
    homeLogo: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg",
    awayLogo: "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg",
  },
  {
    id: 3,
    home: "Manchester City",
    away: "Newcastle",
    kickoff: "Sat • 5:30 PM",
    homeLogo: "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg",
    awayLogo: "https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg",
  },
  {
    id: 4,
    home: "Manchester United",
    away: "Brighton",
    kickoff: "Sun • 9:00 AM",
    homeLogo: "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg",
    awayLogo: "https://upload.wikimedia.org/wikipedia/en/6/6d/Brighton_%26_Hove_Albion_logo.svg",
  },
  {
    id: 5,
    home: "Aston Villa",
    away: "West Ham",
    kickoff: "Sun • 11:30 AM",
    homeLogo: "https://upload.wikimedia.org/wikipedia/en/f/f9/Aston_Villa_FC_crest_%282016%29.svg",
    awayLogo: "https://upload.wikimedia.org/wikipedia/en/c/c2/West_Ham_United_FC_logo.svg",
  },
  {
    id: 6,
    home: "Everton",
    away: "Fulham",
    kickoff: "Sun • 2:00 PM",
    homeLogo: "https://upload.wikimedia.org/wikipedia/en/7/7c/Everton_FC_logo.svg",
    awayLogo: "https://upload.wikimedia.org/wikipedia/en/e/eb/Fulham_FC_%28shield%29.svg",
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function TeamBadge({
  name,
  logo,
}: {
  name: string;
  logo: string;
}) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-sm font-black text-white">
        {getInitials(name)}
      </div>
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 p-2">
      <img
        src={logo}
        alt={name}
        className="h-10 w-10 object-contain"
        onError={() => setBroken(true)}
      />
    </div>
  );
}

function ScoreInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="number"
      min="0"
      inputMode="numeric"
      value={value}
      onChange={(e) => {
        const next = e.target.value;
        if (next === "" || /^\d+$/.test(next)) {
          onChange(next);
        }
      }}
      className="h-14 w-16 rounded-2xl border border-white/10 bg-white/5 text-center text-xl font-black text-white outline-none transition placeholder:text-white/25 focus:border-emerald-300/40 focus:bg-white/10"
      placeholder="0"
    />
  );
}

function MatchCard({
  match,
  pick,
  onChange,
}: {
  match: Match;
  pick: ScorePick;
  onChange: (next: ScorePick) => void;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.07]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
            Premier League
          </div>
          <div className="mt-2 text-sm text-white/55">{match.kickoff}</div>
        </div>

        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
          Match {match.id}
        </div>
      </div>

      <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 px-4 py-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4">
          <div className="flex flex-col items-center text-center">
            <TeamBadge name={match.home} logo={match.homeLogo} />
            <div className="mt-3 text-sm uppercase tracking-[0.15em] text-white/45">
              Home
            </div>
            <div className="mt-1 text-base font-bold text-white sm:text-lg">
              {match.home}
            </div>
          </div>

          <div className="flex items-center justify-center pt-6">
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold tracking-[0.22em] text-white/45">
              VS
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            <TeamBadge name={match.away} logo={match.awayLogo} />
            <div className="mt-3 text-sm uppercase tracking-[0.15em] text-white/45">
              Away
            </div>
            <div className="mt-1 text-base font-bold text-white sm:text-lg">
              {match.away}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[22px] border border-cyan-400/10 bg-cyan-400/5 px-4 py-4">
          <div className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
            Score Ticker
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="flex flex-col items-center">
              <div className="text-xs uppercase tracking-[0.15em] text-white/45">
                {match.home}
              </div>
              <div className="mt-3">
                <ScoreInput
                  value={pick.homeScore}
                  onChange={(value) =>
                    onChange({
                      ...pick,
                      homeScore: value,
                    })
                  }
                />
              </div>
            </div>

            <div className="pt-6 text-center text-2xl font-black text-white/40">
              -
            </div>

            <div className="flex flex-col items-center">
              <div className="text-xs uppercase tracking-[0.15em] text-white/45">
                {match.away}
              </div>
              <div className="mt-3">
                <ScoreInput
                  value={pick.awayScore}
                  onChange={(value) =>
                    onChange({
                      ...pick,
                      awayScore: value,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
          Prediction Preview
        </div>
        <div className="mt-2 text-sm text-white/75">
          {pick.homeScore !== "" && pick.awayScore !== ""
            ? `${match.home} ${pick.homeScore} - ${pick.awayScore} ${match.away}`
            : "Enter a score for both teams to complete this prediction."}
        </div>
      </div>
    </div>
  );
}

export default function PremierLeaguePredictionsPage() {
  const [picks, setPicks] = useState<Record<number, ScorePick>>(
    Object.fromEntries(
      matches.map((match) => [match.id, { homeScore: "", awayScore: "" }])
    )
  );

  function updatePick(matchId: number, next: ScorePick) {
    setPicks((prev) => ({
      ...prev,
      [matchId]: next,
    }));
  }

  const totalMatches = matches.length;

  const totalCompleted = useMemo(() => {
    return matches.filter((match) => {
      const pick = picks[match.id];
      return pick.homeScore !== "" && pick.awayScore !== "";
    }).length;
  }, [picks]);

  const allCompleted = totalCompleted === totalMatches;

  return (
    <main className="min-h-screen bg-[#05070f] text-white">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_26%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.10),transparent_22%),linear-gradient(to_bottom,rgba(5,7,15,0.22),rgba(5,7,15,0.97))]" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
              Soccer Zone • Premier League
            </div>

            <h1 className="mt-6 text-4xl font-black uppercase tracking-tight sm:text-5xl lg:text-6xl">
              Exact Score Predictions
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
              Predict the exact score for each featured Premier League match and
              build your full matchweek card.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                League
              </div>
              <div className="mt-3 text-2xl font-bold text-white">
                Premier League
              </div>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                Matchweek
              </div>
              <div className="mt-3 text-2xl font-bold text-white">
                Week 1
              </div>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">
                Progress
              </div>
              <div className="mt-3 text-2xl font-bold text-white">
                {totalCompleted}/{totalMatches} Complete
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-6 xl:grid-cols-[1fr_340px]">
            <div>
              <div className="mb-5">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  Featured Fixtures
                </div>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  Enter your scorelines
                </h2>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                {matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    pick={picks[match.id]}
                    onChange={(next) => updatePick(match.id, next)}
                  />
                ))}
              </div>
            </div>

            <aside className="h-fit rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl xl:sticky xl:top-24">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                Your Card
              </div>

              <h2 className="mt-3 text-2xl font-bold text-white">
                Matchweek Summary
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/65">
                Review every exact score before you submit your predictions.
              </p>

              <div className="mt-6 space-y-3">
                {matches.map((match) => {
                  const pick = picks[match.id];
                  const complete =
                    pick.homeScore !== "" && pick.awayScore !== "";

                  return (
                    <div
                      key={match.id}
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                    >
                      <div className="text-sm font-semibold text-white">
                        {match.home} vs {match.away}
                      </div>
                      <div className="mt-1 text-sm text-white/55">
                        {complete
                          ? `${pick.homeScore} - ${pick.awayScore}`
                          : "No score entered yet"}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={!allCompleted}
                className={[
                  "mt-6 w-full rounded-2xl px-5 py-4 text-sm font-semibold transition",
                  allCompleted
                    ? "bg-white text-black hover:scale-[1.01]"
                    : "cursor-not-allowed border border-white/10 bg-white/5 text-white/40",
                ].join(" ")}
              >
                Submit Predictions
              </button>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}