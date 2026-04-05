"use client";

import { useState } from "react";

type PickOption = "HOME" | "DRAW" | "AWAY";

type Match = {
  id: number;
  home: string;
  away: string;
  kickoff: string;
};

const matches: Match[] = [
  { id: 1, home: "Arsenal", away: "Chelsea", kickoff: "Sat • 12:30 PM" },
  { id: 2, home: "Liverpool", away: "Tottenham", kickoff: "Sat • 3:00 PM" },
  { id: 3, home: "Manchester City", away: "Newcastle", kickoff: "Sat • 5:30 PM" },
  { id: 4, home: "Manchester United", away: "Brighton", kickoff: "Sun • 9:00 AM" },
  { id: 5, home: "Aston Villa", away: "West Ham", kickoff: "Sun • 11:30 AM" },
  { id: 6, home: "Everton", away: "Fulham", kickoff: "Sun • 2:00 PM" },
];

function PickButton({
  label,
  active,
  onClick,
}: {
  label: PickOption;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
        active
          ? "border-emerald-300/40 bg-emerald-400/15 text-white shadow-[0_0_20px_rgba(16,185,129,0.18)]"
          : "border-white/10 bg-white/5 text-white/75 hover:border-white/20 hover:bg-white/10 hover:text-white",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function MatchCard({
  match,
  selectedPick,
  onPick,
}: {
  match: Match;
  selectedPick?: PickOption;
  onPick: (pick: PickOption) => void;
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

      <div className="mt-6 space-y-4">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
          <div className="text-xs uppercase tracking-[0.15em] text-white/45">
            Home
          </div>
          <div className="mt-1 text-lg font-bold text-white">{match.home}</div>
        </div>

        <div className="flex items-center justify-center">
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-bold tracking-[0.22em] text-white/45">
            VS
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
          <div className="text-xs uppercase tracking-[0.15em] text-white/45">
            Away
          </div>
          <div className="mt-1 text-lg font-bold text-white">{match.away}</div>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
          Choose Prediction
        </div>

        <div className="grid grid-cols-3 gap-3">
          <PickButton
            label="HOME"
            active={selectedPick === "HOME"}
            onClick={() => onPick("HOME")}
          />
          <PickButton
            label="DRAW"
            active={selectedPick === "DRAW"}
            onClick={() => onPick("DRAW")}
          />
          <PickButton
            label="AWAY"
            active={selectedPick === "AWAY"}
            onClick={() => onPick("AWAY")}
          />
        </div>
      </div>
    </div>
  );
}

export default function PremierLeaguePredictionsPage() {
  const [picks, setPicks] = useState<Record<number, PickOption>>({});

  function handlePick(matchId: number, pick: PickOption) {
    setPicks((prev) => ({
      ...prev,
      [matchId]: pick,
    }));
  }

  const totalMatches = matches.length;
  const totalPicked = Object.keys(picks).length;

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
              Matchweek Predictions
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
              Pick the outcome for each featured Premier League match and build
              your matchweek card.
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
                {totalPicked}/{totalMatches} Picked
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-6 xl:grid-cols-[1fr_320px]">
            <div>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
                    Featured Fixtures
                  </div>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    Select your predictions
                  </h2>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                {matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    selectedPick={picks[match.id]}
                    onPick={(pick) => handlePick(match.id, pick)}
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
                Review your selected predictions before submission.
              </p>

              <div className="mt-6 space-y-3">
                {matches.map((match) => {
                  const pick = picks[match.id];

                  return (
                    <div
                      key={match.id}
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                    >
                      <div className="text-sm font-semibold text-white">
                        {match.home} vs {match.away}
                      </div>
                      <div className="mt-1 text-sm text-white/55">
                        {pick ? `Pick: ${pick}` : "No pick yet"}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="mt-6 w-full rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-black transition hover:scale-[1.01]"
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