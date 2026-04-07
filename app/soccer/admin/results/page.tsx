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

type MatchweekOption = {
  value: string;
  label: string;
};

type MatchweekResponse = {
  leagueSlug: string;
  leagueName: string;
  matchweekLabel: string | null;
  matchday: number | null;
  matches: Match[];
  availableMatchweeks?: MatchweekOption[] | string[];
};

type ResultRow = {
  match_id: string;
  home_team: string;
  away_team: string;
  kickoff: string;
  home_score: string;
  away_score: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function getShortTeamName(name: string) {
  const map: Record<string, string> = {
    "West Ham United": "West Ham",
    "West Ham United FC": "West Ham",
    "Wolverhampton Wanderers": "Wolves",
    "Wolverhampton Wanderers FC": "Wolves",
    Wolverhampton: "Wolves",
    "AFC Bournemouth": "Bournemouth",
    "Brighton & Hove Albion": "Brighton",
    "Brighton and Hove Albion": "Brighton",
    "Brighton Hove": "Brighton",
    "Tottenham Hotspur": "Tottenham",
    "Tottenham Hotspur FC": "Tottenham",
    "Newcastle United": "Newcastle",
    "Newcastle United FC": "Newcastle",
    "Manchester United": "Man United",
    "Manchester United FC": "Man United",
    "Manchester City": "Man City",
    "Manchester City FC": "Man City",
    "Nottingham Forest": "Nottingham Forest",
    Nottingham: "Nottingham Forest",
    "Leicester City": "Leicester",
    "Ipswich Town": "Ipswich",
    "Crystal Palace": "Palace",
    "West Bromwich Albion": "West Brom",
  };

  return map[name] || name;
}

function normalizeMatchweekOptions(
  availableMatchweeks: MatchweekResponse["availableMatchweeks"],
  currentLabel: string | null
) {
  const normalized: MatchweekOption[] = [];

  if (Array.isArray(availableMatchweeks)) {
    for (const item of availableMatchweeks) {
      if (typeof item === "string") {
        normalized.push({
          value: item,
          label: item,
        });
      } else if (item?.value && item?.label) {
        normalized.push(item);
      }
    }
  }

  if (
    currentLabel &&
    !normalized.some((option) => option.value === currentLabel)
  ) {
    normalized.unshift({
      value: currentLabel,
      label: currentLabel,
    });
  }

  return normalized;
}

function formatKickoff(isoString: string) {
  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) return isoString;

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

function toInputValue(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
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
      <div className="flex h-24 w-24 items-center justify-center rounded-[26px] border border-white/10 bg-gradient-to-br from-white/15 to-white/5 text-xl font-black text-white shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
        {getInitials(name)}
      </div>
    );
  }

  return (
    <div className="relative flex h-24 w-24 items-center justify-center rounded-[26px] border border-white/10 bg-gradient-to-br from-white/15 to-white/5 p-3 shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
      <img
        src={logo}
        alt={name}
        className="h-16 w-16 object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,0.65)]"
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
  const numericValue = value === "" ? 0 : Number(value);

  function increase() {
    const next = Math.min(99, numericValue + 1);
    onChange(String(next));
  }

  function decrease() {
    const next = Math.max(0, numericValue - 1);
    onChange(String(next));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      increase();
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      decrease();
    }
  }

  return (
    <div
      role="spinbutton"
      tabIndex={0}
      aria-valuemin={0}
      aria-valuemax={99}
      aria-valuenow={numericValue}
      onKeyDown={handleKeyDown}
      className="relative h-20 w-20 overflow-hidden rounded-[22px] border border-white/10 bg-black/85 text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03),0_10px_24px_rgba(0,0,0,0.35)]"
    >
      <button
        type="button"
        onClick={increase}
        className="absolute inset-x-0 top-0 h-1/2 border-b border-white/5 bg-transparent transition hover:bg-white/5"
        aria-label="Increase score"
      />
      <button
        type="button"
        onClick={decrease}
        className="absolute inset-x-0 bottom-0 h-1/2 bg-transparent transition hover:bg-white/5"
        aria-label="Decrease score"
      />
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/20">
          ▲
        </div>
        <div className="leading-none text-5xl font-black text-white [font-variant-numeric:tabular-nums]">
          {value === "" ? "0" : value}
        </div>
        <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/20">
          ▼
        </div>
      </div>
    </div>
  );
}

function ResultCard({
  match,
  row,
  onChange,
}: {
  match: Match;
  row: ResultRow;
  onChange: (next: { home_score: string; away_score: string }) => void;
}) {
  const homeShort = getShortTeamName(match.home);
  const awayShort = getShortTeamName(match.away);
  const hasResult = row.home_score !== "" && row.away_score !== "";

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition hover:border-emerald-400/20 hover:bg-white/[0.07]">
      <div className="text-center">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200">
          Final Result
        </div>
        <div className="mt-1.5 text-sm text-white/55">
          {formatKickoff(match.kickoff)}
        </div>

        <div className="mt-2 inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold">
          {hasResult ? (
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-emerald-200">
              Ready
            </span>
          ) : (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/60">
              Empty
            </span>
          )}
        </div>
      </div>

      <div className="relative mt-4 rounded-[24px] border border-white/10 bg-black/20 px-4 py-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2">
          <div className="flex min-w-0 flex-col items-center text-center">
            <TeamBadge name={match.home} logo={match.homeLogo} />
            <div className="mt-3 text-xs uppercase tracking-[0.18em] text-white/35">
              Home
            </div>
            <div className="mt-1.5 w-full max-w-[140px] text-center text-[1.05rem] font-extrabold leading-tight text-white">
              {homeShort}
            </div>
          </div>

          <div className="flex items-center justify-center pt-6">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold tracking-[0.28em] text-white/45">
              FT
            </div>
          </div>

          <div className="flex min-w-0 flex-col items-center text-center">
            <TeamBadge name={match.away} logo={match.awayLogo} />
            <div className="mt-3 text-xs uppercase tracking-[0.18em] text-white/35">
              Away
            </div>
            <div className="mt-1.5 w-full max-w-[140px] text-center text-[1.05rem] font-extrabold leading-tight text-white">
              {awayShort}
            </div>
          </div>
        </div>

        <div className="relative mt-5 rounded-[22px] border border-cyan-400/10 bg-[#03060d] px-4 py-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="flex justify-center">
              <ScoreInput
                value={row.home_score}
                onChange={(value) =>
                  onChange({
                    home_score: value,
                    away_score: row.away_score,
                  })
                }
              />
            </div>

            <div className="flex h-20 items-center justify-center">
              <div className="text-4xl font-black leading-none tracking-[0.08em] text-white/70">
                :
              </div>
            </div>

            <div className="flex justify-center">
              <ScoreInput
                value={row.away_score}
                onChange={(value) =>
                  onChange({
                    home_score: row.home_score,
                    away_score: value,
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSoccerResultsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [rows, setRows] = useState<Record<string, ResultRow>>({});

  const [leagueName, setLeagueName] = useState("Premier League");
  const [matchweekLabel, setMatchweekLabel] = useState<string | null>(null);
  const [selectedMatchweek, setSelectedMatchweek] = useState("");
  const [availableMatchweeks, setAvailableMatchweeks] = useState<MatchweekOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [grading, setGrading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPage() {
      try {
        setLoading(true);
        setError("");
        setMessage("");

        const params = new URLSearchParams();
        if (selectedMatchweek) {
          params.set("matchweek", selectedMatchweek);
        }

        const matchweekRes = await fetch(
          `/api/soccer/predictions/premier-league/matchweek${
            params.toString() ? `?${params.toString()}` : ""
          }`,
          { cache: "no-store" }
        );
        const matchweekData: MatchweekResponse & { error?: string } =
          await matchweekRes.json();

        if (!matchweekRes.ok) {
          throw new Error(matchweekData?.error || "Failed to load matches");
        }

        const liveMatches = Array.isArray(matchweekData?.matches)
          ? matchweekData.matches
          : [];

        const nextLabel = matchweekData.matchweekLabel || null;
        const normalizedOptions = normalizeMatchweekOptions(
          matchweekData.availableMatchweeks,
          nextLabel
        );

        setMatches(liveMatches);
        setLeagueName(matchweekData.leagueName || "Premier League");
        setMatchweekLabel(nextLabel);
        setAvailableMatchweeks(normalizedOptions);

        if (!selectedMatchweek && nextLabel) {
          setSelectedMatchweek(nextLabel);
        }

        const initialRows: Record<string, ResultRow> = {};
        for (const match of liveMatches) {
          initialRows[String(match.id)] = {
            match_id: String(match.id),
            home_team: match.home,
            away_team: match.away,
            kickoff: match.kickoff,
            home_score: "",
            away_score: "",
          };
        }

        const resultsRes = await fetch(
          `/api/admin/soccer-results?leagueSlug=premier-league${
            params.toString() ? `&${params.toString()}` : ""
          }`,
          { cache: "no-store" }
        );
        const resultsData = await resultsRes.json();

        if (!resultsRes.ok) {
          throw new Error(resultsData?.error || "Failed to load saved results");
        }

        const savedRows = Array.isArray(resultsData?.rows) ? resultsData.rows : [];

        for (const saved of savedRows) {
          const matchId = String(saved.match_id);
          if (!initialRows[matchId]) continue;

          initialRows[matchId] = {
            ...initialRows[matchId],
            home_score: toInputValue(saved.home_score),
            away_score: toInputValue(saved.away_score),
          };
        }

        setRows(initialRows);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load page");
        setMatches([]);
        setRows({});
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [selectedMatchweek]);

  const orderedRows = useMemo(() => {
    return matches
      .map((match) => ({
        match,
        row: rows[String(match.id)],
      }))
      .filter((item) => Boolean(item.row));
  }, [matches, rows]);

  const completedCount = useMemo(() => {
    return orderedRows.filter(
      ({ row }) => row.home_score !== "" && row.away_score !== ""
    ).length;
  }, [orderedRows]);

  function updateRow(
    matchId: string,
    next: { home_score: string; away_score: string }
  ) {
    setRows((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        ...next,
      },
    }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = orderedRows
        .filter(({ row }) => row.home_score !== "" && row.away_score !== "")
        .map(({ row }) => ({
          ...row,
          home_score: Number(row.home_score),
          away_score: Number(row.away_score),
        }));

      const res = await fetch("/api/admin/soccer-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leagueSlug: "premier-league",
          matchweekLabel,
          rows: payload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to save results");
      }

      setMessage("Final scores saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save results");
    } finally {
      setSaving(false);
    }
  }

  async function handleGrade() {
    try {
      setGrading(true);
      setError("");
      setMessage("");

      const completedRows = orderedRows
        .filter(({ row }) => row.home_score !== "" && row.away_score !== "")
        .map(({ row }) => ({
          match_id: row.match_id,
          actual_home_score: Number(row.home_score),
          actual_away_score: Number(row.away_score),
        }));

      if (!matchweekLabel) {
        throw new Error("No active matchweek selected.");
      }

      if (completedRows.length === 0) {
        throw new Error("Enter at least one completed result before grading.");
      }

      const res = await fetch("/api/admin/grade-soccer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leagueSlug: "premier-league",
          matchweekLabel,
          results: completedRows,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to grade matchweek");
      }

      setMessage(
        `Grading complete. Updated ${Number(data?.updatedPicks ?? 0)} pick(s).`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to grade matchweek");
    } finally {
      setGrading(false);
    }
  }

  async function handleResetWeek() {
    try {
      if (!matchweekLabel) {
        throw new Error("No active matchweek selected.");
      }

      const confirmed = window.confirm(
        `Reset ${matchweekLabel}? This will clear saved results and grading for that week.`
      );

      if (!confirmed) return;

      setResetting(true);
      setError("");
      setMessage("");

      const res = await fetch("/api/admin/reset-soccer-week", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leagueSlug: "premier-league",
          matchweekLabel,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to reset week");
      }

      const clearedRows: Record<string, ResultRow> = {};
      for (const match of matches) {
        clearedRows[String(match.id)] = {
          match_id: String(match.id),
          home_team: match.home,
          away_team: match.away,
          kickoff: match.kickoff,
          home_score: "",
          away_score: "",
        };
      }

      setRows(clearedRows);
      setMessage(`Reset complete for ${matchweekLabel}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset week");
    } finally {
      setResetting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#05070f] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
            Admin • Soccer Results
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-tight">
            Results Control Center
          </h1>

          <p className="mt-3 max-w-2xl text-white/65">
            Enter final scores, save them, grade the week, or reset the week back
            to blank.
          </p>
        </div>

        <div className="mb-6 rounded-[24px] border border-white/10 bg-white/5 p-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto]">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  League
                </div>
                <div className="mt-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-semibold text-white">
                  {leagueName}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                  Matchweek
                </div>

                <select
                  value={selectedMatchweek}
                  onChange={(e) => setSelectedMatchweek(e.target.value)}
                  className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-semibold text-white outline-none transition hover:border-white/15 focus:border-cyan-400/35"
                >
                  {availableMatchweeks.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="bg-[#0b1020] text-white"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading || orderedRows.length === 0}
              className="rounded-[24px] border border-cyan-400/25 bg-cyan-500/10 px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-cyan-100 transition hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Results"}
            </button>

            <button
              type="button"
              onClick={handleGrade}
              disabled={grading || loading || orderedRows.length === 0}
              className="rounded-[24px] border border-emerald-400/25 bg-emerald-500/15 px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {grading ? "Grading..." : "Grade Week"}
            </button>

            <button
              type="button"
              onClick={handleResetWeek}
              disabled={resetting || loading || orderedRows.length === 0}
              className="rounded-[24px] border border-red-400/25 bg-red-500/10 px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-red-100 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resetting ? "Resetting..." : "Reset Week"}
            </button>
          </div>
        </div>

        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
              Active Week
            </div>
            <div className="mt-2 text-xl font-black text-white">
              {matchweekLabel || "—"}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
              Matches
            </div>
            <div className="mt-2 text-xl font-black text-white">
              {orderedRows.length}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
              Results Entered
            </div>
            <div className="mt-2 text-xl font-black text-white">
              {completedCount}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/70">
            Loading matches...
          </div>
        ) : null}

        {error ? (
          <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {message}
          </div>
        ) : null}

        {!loading && orderedRows.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/70">
            No scheduled matches found for this matchweek.
          </div>
        ) : null}

        {!loading ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {orderedRows.map(({ match, row }) => (
              <ResultCard
                key={row.match_id}
                match={match}
                row={row}
                onChange={(next) => updateRow(row.match_id, next)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}