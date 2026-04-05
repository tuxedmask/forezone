"use client";

import { useEffect, useMemo, useState } from "react";

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

type MatchweekResponse = {
  leagueSlug: string;
  leagueName: string;
  matchweekLabel: string | null;
  matchday: number | null;
  matches: Match[];
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function formatKickoff(isoString: string) {
  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) {
    return isoString;
  }

  return new Intl.DateTimeFormat("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Toronto",
  }).format(date);
}

function TeamBadge({
  name,
  logo,
}: {
  name: string;
  logo: string;
}) {
  const [broken, setBroken] = useState(false);

  if (!logo || broken) {
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
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <input
      type="number"
      min="0"
      inputMode="numeric"
      value={value}
      disabled={disabled}
      onChange={(e) => {
        const next = e.target.value;
        if (next === "" || /^\d+$/.test(next)) {
          onChange(next);
        }
      }}
      className="h-14 w-16 rounded-2xl border border-white/10 bg-white/5 text-center text-xl font-black text-white outline-none transition placeholder:text-white/25 focus:border-emerald-300/40 focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
      placeholder="0"
    />
  );
}

function MatchCard({
  match,
  pick,
  onChange,
  locked = false,
  leagueName,
}: {
  match: Match;
  pick: ScorePick;
  onChange: (next: ScorePick) => void;
  locked?: boolean;
  leagueName: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.07]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
            {leagueName}
          </div>
          <div className="mt-2 text-sm text-white/55">
            {formatKickoff(match.kickoff)}
          </div>
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
                  disabled={locked}
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
                  disabled={locked}
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
  const [matches, setMatches] = useState<Match[]>([]);
  const [leagueName, setLeagueName] = useState("Premier League");
  const [matchweekLabel, setMatchweekLabel] = useState<string | null>(null);

  const [picks, setPicks] = useState<Record<number, ScorePick>>({});
  const [loadingMatchweek, setLoadingMatchweek] = useState(true);
  const [loadingEntry, setLoadingEntry] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [entryLocked, setEntryLocked] = useState(false);
  const [weekLocked, setWeekLocked] = useState(false);

  function updatePick(matchId: number, next: ScorePick) {
    setPicks((prev) => ({
      ...prev,
      [matchId]: next,
    }));
  }

  useEffect(() => {
    async function loadMatchweek() {
      try {
        setLoadingMatchweek(true);
        setSubmitError("");
        setSubmitSuccess("");

        const res = await fetch(
          "/api/soccer/predictions/premier-league/matchweek",
          {
            cache: "no-store",
          }
        );

        const data: MatchweekResponse & { error?: string } = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load matchweek");
        }

        const liveMatches = Array.isArray(data.matches) ? data.matches : [];

        setMatches(liveMatches);
        setLeagueName(data.leagueName || "Premier League");
        setMatchweekLabel(data.matchweekLabel || null);

        const initialPicks: Record<number, ScorePick> = {};
        for (const match of liveMatches) {
          initialPicks[match.id] = { homeScore: "", awayScore: "" };
        }
        setPicks(initialPicks);
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : "Failed to load matchweek"
        );
      } finally {
        setLoadingMatchweek(false);
      }
    }

    loadMatchweek();
  }, []);

  useEffect(() => {
    if (matches.length === 0) {
      setWeekLocked(false);
      return;
    }

    const earliestKickoff = matches
      .map((match) => new Date(match.kickoff).getTime())
      .filter((ts) => !Number.isNaN(ts))
      .sort((a, b) => a - b)[0];

    if (!earliestKickoff) {
      setWeekLocked(false);
      return;
    }

    setWeekLocked(Date.now() >= earliestKickoff);
  }, [matches]);

  useEffect(() => {
    async function loadExistingEntry() {
      try {
        if (!matchweekLabel || matches.length === 0) return;

        setLoadingEntry(true);
        setSubmitError("");
        setSubmitSuccess("");

        const params = new URLSearchParams({
          leagueSlug: "premier-league",
          matchweekLabel,
        });

        const res = await fetch(
          `/api/soccer/predictions/my-entry?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load existing entry");
        }

        if (data?.entry && Array.isArray(data?.picks)) {
          setPicks((prev) => {
            const nextPicks = { ...prev };

            for (const row of data.picks) {
              const matchId = Number(row.match_id);

              nextPicks[matchId] = {
                homeScore: String(row.predicted_home_score),
                awayScore: String(row.predicted_away_score),
              };
            }

            return nextPicks;
          });

          setEntryLocked(true);
          setSubmitSuccess("Your predictions have already been submitted.");
        } else {
          setEntryLocked(false);
        }
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : "Failed to load entry"
        );
      } finally {
        setLoadingEntry(false);
      }
    }

    loadExistingEntry();
  }, [matchweekLabel, matches]);

  const totalMatches = matches.length;

  const totalCompleted = useMemo(() => {
    return matches.filter((match) => {
      const pick = picks[match.id];
      return pick?.homeScore !== "" && pick?.awayScore !== "";
    }).length;
  }, [matches, picks]);

  const allCompleted = totalMatches > 0 && totalCompleted === totalMatches;
  const pageLoading = loadingMatchweek || loadingEntry;
  const inputsLocked = entryLocked || weekLocked;

  async function handleSubmit() {
    try {
      setSubmitError("");
      setSubmitSuccess("");
      setSubmitting(true);

      if (entryLocked) {
        setSubmitError("You already submitted predictions for this matchweek.");
        return;
      }

      if (weekLocked) {
        setSubmitError("This matchweek has already started.");
        return;
      }

      if (!matchweekLabel) {
        setSubmitError("No active matchweek is available right now.");
        return;
      }

      if (!allCompleted) {
        setSubmitError("Please complete every score prediction first.");
        return;
      }

      const payload = matches.map((match) => ({
        match_id: String(match.id),
        home_team: match.home,
        away_team: match.away,
        predicted_home_score: Number(picks[match.id].homeScore),
        predicted_away_score: Number(picks[match.id].awayScore),
      }));

      const res = await fetch("/api/soccer/predictions/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leagueSlug: "premier-league",
          matchweekLabel,
          picks: payload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to submit predictions");
      }

      setEntryLocked(true);
      setSubmitSuccess("Predictions submitted successfully.");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#05070f] text-white">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_26%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.10),transparent_22%),linear-gradient(to_bottom,rgba(5,7,15,0.22),rgba(5,7,15,0.97))]" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
              Soccer Zone • {leagueName}
            </div>

            <h1 className="mt-6 text-4xl font-black uppercase tracking-tight sm:text-5xl lg:text-6xl">
              Exact Score Predictions
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
              Predict the exact score for each featured match and build your
              full matchweek card.
            </p>

            {pageLoading ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
                Loading current gameweek and saved predictions...
              </div>
            ) : null}

            {!pageLoading && weekLocked && !entryLocked ? (
              <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                This matchweek has already started, so predictions are locked.
              </div>
            ) : null}
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                League
              </div>
              <div className="mt-3 text-2xl font-bold text-white">
                {leagueName}
              </div>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                Matchweek
              </div>
              <div className="mt-3 text-2xl font-bold text-white">
                {matchweekLabel || "No active week"}
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

              {matches.length === 0 && !loadingMatchweek ? (
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-white/65">
                  No upcoming matches found for the current gameweek.
                </div>
              ) : (
                <div className="grid gap-5 lg:grid-cols-2">
                  {matches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      pick={picks[match.id] || { homeScore: "", awayScore: "" }}
                      onChange={(next) => updatePick(match.id, next)}
                      locked={inputsLocked}
                      leagueName={leagueName}
                    />
                  ))}
                </div>
              )}
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
                  const pick = picks[match.id] || {
                    homeScore: "",
                    awayScore: "",
                  };
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
                onClick={handleSubmit}
                disabled={
                  !allCompleted ||
                  submitting ||
                  entryLocked ||
                  pageLoading ||
                  matches.length === 0 ||
                  weekLocked
                }
                className={[
                  "mt-6 w-full rounded-2xl px-5 py-4 text-sm font-semibold transition",
                  allCompleted &&
                  !submitting &&
                  !entryLocked &&
                  !pageLoading &&
                  matches.length > 0 &&
                  !weekLocked
                    ? "bg-white text-black hover:scale-[1.01]"
                    : "cursor-not-allowed border border-white/10 bg-white/5 text-white/40",
                ].join(" ")}
              >
                {pageLoading
                  ? "Loading..."
                  : submitting
                  ? "Submitting..."
                  : entryLocked
                  ? "Already Submitted"
                  : weekLocked
                  ? "Matchweek Locked"
                  : "Submit Predictions"}
              </button>

              {submitError ? (
                <div className="mt-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {submitError}
                </div>
              ) : null}

              {submitSuccess ? (
                <div className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {submitSuccess}
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}