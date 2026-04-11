"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  PickRowCard,
  type WeeklyPredictionPick,
} from "@/app/profile/WeeklyPredictionHistory";

type RangeType = "weekly" | "all";

type LeaderboardRow = {
  rank?: number;
  userId?: string | null;
  alias?: string | null;
  userName?: string | null;
  userImage?: string | null;
  totalPoints?: number | null;
  correctScores?: number | null;
  picksCount?: number | null;
  pending?: number | null;
  winPct?: string | number | null;
  streak?: number | null;
  wins?: number | null;
  losses?: number | null;
  units?: number | null;
  total?: number | null;
};

type UserExpandedPick = WeeklyPredictionPick;

type UserPicksMap = Record<string, UserExpandedPick[]>;

function getRangeLabel(range: RangeType) {
  return range === "weekly" ? "Weekly" : "All-Time";
}

function getRankIcon(index: number) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `#${index + 1}`;
}

function getTopPercent(index: number, total: number) {
  if (!total) return null;

  const pct = ((index + 1) / total) * 100;

  if (pct <= 1) return "Top 1%";
  if (pct <= 5) return "Top 5%";
  if (pct <= 10) return "Top 10%";
  if (pct <= 25) return "Top 25%";
  return null;
}

function getSafeName(row: LeaderboardRow) {
  return (row.alias || row.userName || "User").trim() || "User";
}

function getInitials(name?: string | null) {
  const safe = (name || "User").trim();
  if (!safe) return "U";

  return safe
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getWinPctValue(row: LeaderboardRow) {
  if (row.winPct !== undefined && row.winPct !== null) {
    return typeof row.winPct === "number" ? row.winPct.toFixed(1) : row.winPct;
  }

  const wins = Number(row.wins ?? 0);
  const losses = Number(row.losses ?? 0);
  const decided = wins + losses;

  if (!decided) return "0.0";
  return ((wins / decided) * 100).toFixed(1);
}

function getPointsValue(row: LeaderboardRow) {
  const value =
    row.totalPoints !== undefined && row.totalPoints !== null
      ? Number(row.totalPoints)
      : Number(row.units ?? 0);

  return Math.round(value * 100) / 100;
}

function getRecordValue(row: LeaderboardRow) {
  const wins = Number(row.wins ?? 0);
  const losses = Number(row.losses ?? 0);
  return `${wins}-${losses}`;
}

function isCurrentUserRow(row: LeaderboardRow, session: any) {
  const sessionUser = session?.user as any;

  const possibleIds = [
    sessionUser?.appUserId,
    sessionUser?.id,
    sessionUser?.userId,
  ].filter(Boolean);

  return !!row.userId && possibleIds.includes(row.userId);
}

function getGlow(index: number) {
  if (index === 0) return "from-yellow-500/20 border-yellow-400/40";
  if (index === 1) return "from-slate-300/15 border-slate-300/30";
  if (index === 2) return "from-orange-400/20 border-orange-400/30";
  return "from-indigo-500/10 border-white/10";
}

function buildWeekOptions(startWeek = 32, totalWeeks = 38) {
  return Array.from(
    { length: Math.max(totalWeeks - startWeek + 1, 0) },
    (_, i) => startWeek + i
  );
}

function CorrectScoreBullseyes({ count }: { count: number }) {
  if (!count) return null;

  const visible = Math.min(count, 5);
  const extra = count - visible;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: visible }).map((_, i) => (
        <span
  key={i}
  className="text-3xl leading-none text-white drop-shadow-[0_0_8px_rgba(255,255,255,1)]"
>
  🎯
</span>
      ))}
      {extra > 0 ? (
        <span className="ml-1 text-xs font-bold text-white/80 drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]">
          +{extra}
        </span>
      ) : null}
    </div>
  );
}

export default function LeaderboardPage() {
  const { data: session } = useSession();
const [openUserId, setOpenUserId] = useState<string | null>(null);
const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
const [userPicksMap, setUserPicksMap] = useState<UserPicksMap>({});
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [range, setRange] = useState<RangeType>("weekly");
  const [currentMatchweek, setCurrentMatchweek] = useState<number | null>(null);
  const [selectedMatchweek, setSelectedMatchweek] = useState<number | null>(null);
  const [rangeMenuOpen, setRangeMenuOpen] = useState(false);
  const [matchweekMenuOpen, setMatchweekMenuOpen] = useState(false);

  async function fetchLeaderboard(
    rangeValue: RangeType,
    weekValue: number | null,
    currentWeekValue: number | null
  ) {
    const url =
      rangeValue === "weekly"
        ? `/api/soccer/leaderboard?leagueSlug=premier-league&range=weekly&matchweek=${weekValue ?? currentWeekValue ?? ""}`
        : `/api/soccer/leaderboard?leagueSlug=premier-league&range=all`;

    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    return Array.isArray(data) ? data : data?.leaderboard || [];
  }

async function toggleUserPicks(row: LeaderboardRow) {
  const userId = row.userId || null;
  if (!userId) {
    console.log("No userId on row:", row);
    return;
  }

  if (openUserId === userId) {
    setOpenUserId(null);
    return;
  }

  setOpenUserId(userId);


  try {
    setLoadingUserId(userId);

    const weekValue = selectedMatchweek ?? currentMatchweek ?? "";
    const url = `/api/soccer/leaderboard-user-picks?leagueSlug=premier-league&userId=${encodeURIComponent(
      userId
    )}&matchweek=${encodeURIComponent(String(weekValue))}`;

    console.log("Fetching leaderboard picks:", {
      row,
      userId,
      weekValue,
      url,
    });

    const res = await fetch(url, { cache: "no-store" });

const raw = await res.text();
console.log("Leaderboard picks raw response:", raw);

let data: any = {};
try {
  data = raw ? JSON.parse(raw) : {};
} catch {
  data = { raw };
}

console.log("Leaderboard picks response:", data);

if (!res.ok) {
throw new Error(data?.details || data?.error || `Request failed: ${res.status}`);}

    const picks = Array.isArray(data?.picks) ? data.picks : [];

    setUserPicksMap((prev) => ({
      ...prev,
      [userId]: picks,
    }));
  } catch (error) {
    console.error("Failed to load user picks:", error);
    setUserPicksMap((prev) => ({
      ...prev,
      [userId]: [],
    }));
  } finally {
    setLoadingUserId(null);
  }
}

  useEffect(() => {
    let active = true;

    async function loadCurrentMatchweek() {
      try {
        const mwRes = await fetch(
          "/api/soccer/predictions/premier-league/matchweek",
          { cache: "no-store" }
        );
        const mwData = await mwRes.json();

        const currentMW =
          Number(mwData?.matchday ?? mwData?.matchweek ?? 0) || null;

        if (!active) return;

        const clampedWeek = currentMW && currentMW < 32 ? 32 : currentMW;

        setCurrentMatchweek(clampedWeek);
        setSelectedMatchweek((prev) => prev ?? clampedWeek);
      } catch (error) {
        console.error("Failed to load current matchweek:", error);
      }
    }

    loadCurrentMatchweek();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadLeaderboard() {
      setInitialLoading(true);

      try {
        const nextRows = await fetchLeaderboard(
          range,
          selectedMatchweek,
          currentMatchweek
        );

        if (!active) return;

        setRows(nextRows);
      } catch (error) {
        console.error("Failed to load leaderboard:", error);
        if (active) setRows([]);
      } finally {
        if (!active) return;
        setInitialLoading(false);
      }
    }

    if (range !== "weekly" || selectedMatchweek || currentMatchweek) {
      loadLeaderboard();
    }

    return () => {
      active = false;
    };
  }, [range, selectedMatchweek, currentMatchweek]);

  const top3 = useMemo(() => rows.slice(0, 3), [rows]);

  const currentUserId =
    (session?.user as any)?.appUserId ||
    (session?.user as any)?.id ||
    (session?.user as any)?.userId ||
    null;

  const currentUserRow = useMemo(() => {
    if (!currentUserId) return null;
    return rows.find((row) => row.userId === currentUserId) || null;
  }, [rows, currentUserId]);

  const remainingRows = useMemo(() => {
  return rows;
}, [rows]);

  const weekOptions = useMemo(() => buildWeekOptions(32, 38), []);

  const totalPicksShown = useMemo(() => {
    return rows.reduce((sum, row) => sum + Number(row.picksCount ?? 0), 0);
  }, [rows]);

  const entriesShown = useMemo(() => {
    return Math.round((totalPicksShown / 10) * 100) / 100;
  }, [totalPicksShown]);

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <section className="relative isolate z-20 overflow-visible">
<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_26%),linear-gradient(to_bottom,rgba(5,7,15,0.25),rgba(5,7,15,0.98))]" />
        <div className="relative z-30 mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
              Soccer Zone • Premier League
            </div>

            <h1 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-5xl lg:text-6xl">
              Lead Zone
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
              {getRangeLabel(range)} rankings — climb the ladder
            </p>

            <p className="mt-1 text-xs text-indigo-300/60">
              Current Matchweek: {currentMatchweek ?? "—"}
            </p>
          </div>

          <div className="mx-auto mt-5 max-w-6xl">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-center shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  Mode
                </div>

                <div className="relative mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRangeMenuOpen((prev) => !prev);
                      setMatchweekMenuOpen(false);
                    }}
                    className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-2xl font-bold text-white transition hover:border-emerald-300/30 hover:bg-black/35"
                  >
                    <span>{getRangeLabel(range)}</span>
                    <span className="text-sm text-white/50">
                      {rangeMenuOpen ? "▲" : "▼"}
                    </span>
                  </button>

                  {rangeMenuOpen ? (
                    <div className="absolute left-4 right-4 top-[72px] z-[100] rounded-2xl border border-white/10 bg-[#0a1220] p-2 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                      {(["weekly", "all"] as RangeType[]).map((r) => {
                        const active = range === r;

                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => {
                              setRange(r);
                              setRangeMenuOpen(false);
                              if (r === "all") {
                                setMatchweekMenuOpen(false);
                              }
                            }}
                            className={`w-full rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${
                              active
                                ? "bg-emerald-500/15 text-emerald-200"
                                : "text-white/80 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            {getRangeLabel(r)}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-center shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                  Matchweek
                </div>

                <div className="relative mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (range !== "weekly") return;
                      setMatchweekMenuOpen((prev) => !prev);
                      setRangeMenuOpen(false);
                    }}
                    className={`inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-2xl font-bold text-white transition ${
                      range === "weekly"
                        ? "hover:border-emerald-300/30 hover:bg-black/35"
                        : "cursor-default opacity-80"
                    }`}
                  >
                    <span>
                      {range === "weekly"
                        ? `Week ${selectedMatchweek ?? currentMatchweek ?? "—"}`
                        : "All Weeks"}
                    </span>
                    {range === "weekly" ? (
                      <span className="text-sm text-white/50">
                        {matchweekMenuOpen ? "▲" : "▼"}
                      </span>
                    ) : null}
                  </button>

                  {range === "weekly" && matchweekMenuOpen ? (
                    <div className="absolute left-4 right-4 top-[72px] z-[100] rounded-2xl border border-white/10 bg-[#0a1220] p-2 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                      <div className="max-h-64 overflow-y-auto">
                        {weekOptions.map((week) => {
                          const active = selectedMatchweek === week;

                          return (
                            <button
                              key={week}
                              type="button"
                              onClick={() => {
                                setSelectedMatchweek(week);
                                setMatchweekMenuOpen(false);
                              }}
                              className={`w-full rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${
                                active
                                  ? "bg-emerald-500/15 text-emerald-200"
                                  : "text-white/80 hover:bg-white/5 hover:text-white"
                              }`}
                            >
                              Week {week}
                              {currentMatchweek === week ? " • Current" : ""}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-center shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">
                  Picks
                </div>

                <div className="mt-3 text-2xl font-bold text-white">
                  {Number.isInteger(entriesShown)
                    ? entriesShown
                    : entriesShown.toFixed(1)}{" "}
                  Entries
                </div>

                <div className="mt-1 text-sm text-white/55">
                  {range === "weekly"
                    ? "Total entries in selected week"
                    : "Total entries shown"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-10">
        {initialLoading ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl bg-white/5"
              />
            ))}
          </div>
        ) : (
          <>
            {top3.length > 0 && (
              <>
                <div className="mt-8 mb-4 text-center">
                  <div className="inline-flex rounded-full border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
                    Top 3
                  </div>
                  <h2 className="mt-3 text-2xl font-black uppercase tracking-[0.18em] text-white sm:text-3xl">
                    Podium Leaders
                  </h2>
                  <p className="mt-2 text-sm text-white/55">
                    The current front-runners for this view
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  {top3.map((p, i) => (
                    <div
                      key={p.userId || `top-${i}`}
                      className={`rounded-3xl border bg-gradient-to-br p-5 transition hover:scale-[1.02] ${
  i === 0
    ? "border-yellow-400/50 from-yellow-500/20 shadow-[0_0_30px_rgba(250,204,21,0.28)]"
    : i === 1
    ? "border-slate-300/40 from-slate-300/15 shadow-[0_0_28px_rgba(226,232,240,0.22)]"
    : "border-orange-400/40 from-orange-400/20 shadow-[0_0_28px_rgba(251,146,60,0.24)]"
} ${
  isCurrentUserRow(p, session)
    ? "ring-2 ring-emerald-400/60 shadow-[0_0_24px_rgba(16,185,129,0.2)]"
    : ""
}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div
  className={`text-4xl leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.35)] ${
    i === 0
      ? "drop-shadow-[0_0_14px_rgba(250,204,21,0.9)]"
      : i === 1
      ? "drop-shadow-[0_0_14px_rgba(226,232,240,0.9)]"
      : "drop-shadow-[0_0_14px_rgba(251,146,60,0.9)]"
  }`}
>
  {getRankIcon(i)}
</div>

                        <div className="flex flex-col items-end gap-2">
                          {getTopPercent(i, rows.length) && (
                            <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
                              {getTopPercent(i, rows.length)}
                            </div>
                          )}

                          {isCurrentUserRow(p, session) && (
                            <div className="rounded-full border border-emerald-300/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-200">
                              You
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        {p.userImage ? (
                          <Image
                            src={p.userImage}
                            alt={getSafeName(p)}
                            width={60}
                            height={60}
                            className="rounded-xl object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-500/20 font-bold">
                            {getInitials(p.userName)}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
  <div>
  <div className="font-bold">{getSafeName(p)}</div>
  <div className="text-[10px] text-white/35">
    ID: {p.userId || "missing"}
  </div>
</div>
  <CorrectScoreBullseyes count={Number(p.correctScores ?? 0)} />
</div>
                          
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-3 gap-3">
  <Stat label="Pts" value={getPointsValue(p).toFixed(2)} />
  <Stat label="Correct" value={p.correctScores ?? 0} />
  <Stat
    label="Picks"
    value={`${p.pending ?? 0} / ${p.picksCount ?? 0}`}
  />
</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-6 space-y-3">
              {currentUserRow && (
                <>
                  <div className="mb-2 text-center text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                    Your Position
                  </div>

                  <div className="rounded-2xl border border-emerald-400/35 bg-emerald-500/10 p-4 shadow-[0_0_20px_rgba(16,185,129,0.14)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 font-bold text-emerald-300">
                          {currentUserRow.rank
                            ? `#${currentUserRow.rank}`
                            : `#${
                                rows.findIndex((r) => r.userId === currentUserRow.userId) + 1
                              }`}
                        </div>

                        {currentUserRow.userImage ? (
                          <Image
                            src={currentUserRow.userImage}
                            alt={getSafeName(currentUserRow)}
                            width={45}
                            height={45}
                            className="rounded-xl object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/20">
                            {getInitials(currentUserRow.userName)}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
  <div className="font-bold">{getSafeName(currentUserRow)}</div>
  <CorrectScoreBullseyes count={Number(currentUserRow.correctScores ?? 0)} />
</div>
                            <span className="rounded-full border border-emerald-300/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-200">
                              You
                            </span>
                          </div>
                          
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 lg:mt-0">
  <Stat label="Pts" value={Number(currentUserRow.totalPoints ?? 0).toFixed(2)} />
  <Stat label="Correct" value={currentUserRow.correctScores ?? 0} />
  <Stat
    label="Picks"
    value={`${currentUserRow.pending ?? 0} / ${currentUserRow.picksCount ?? 0}`}
  />
</div>
                    </div>
                  </div>

                  <div className="my-4 h-px w-full bg-white/10" />
                </>
              )}

              <div className="mb-2 text-center text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                Full Leaderboard
              </div>

             {remainingRows.map((p, i) => {
  const rowUserId = p.userId || `row-${i}`;
  const isOpen = openUserId === p.userId;
  const expandedPicks = p.userId ? userPicksMap[p.userId] || [] : [];

  return (
    <div
      key={rowUserId}
      className={`rounded-2xl border p-4 transition ${
        isCurrentUserRow(p, session)
          ? "border-emerald-400/35 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.14)]"
          : "border-white/10 bg-white/5"
      }`}
    >
      <button
        type="button"
        onClick={() => toggleUserPicks(p)}
        className="w-full text-left"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 font-bold">
              {p.rank ? `#${p.rank}` : getRankIcon(i)}
            </div>

            {p.userImage ? (
              <Image
                src={p.userImage}
                alt={getSafeName(p)}
                width={45}
                height={45}
                className="rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/20">
                {getInitials(p.userName)}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="font-bold">{getSafeName(p)}</div>
                  <CorrectScoreBullseyes count={Number(p.correctScores ?? 0)} />
                </div>

                {isCurrentUserRow(p, session) && (
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-200">
                    You
                  </span>
                )}

                <span className="ml-2 text-xs text-white/45">
                  {isOpen ? "▲ Hide games" : "▼ Show games"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 lg:mt-0">
            <Stat label="Pts" value={getPointsValue(p).toFixed(2)} />
            <Stat label="Correct" value={p.correctScores ?? 0} />
            <Stat label="Picks" value={`${p.pending ?? 0} / ${p.picksCount ?? 0}`} />
          </div>
        </div>
      </button>

      {isOpen ? (
        <div className="mt-4 border-t border-white/10 pt-4">
          {loadingUserId === p.userId ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              Loading graded picks...
            </div>
          ) : expandedPicks.length > 0 ? (
            <div className="grid gap-4">
              {expandedPicks.map((pick) => (
                <PickRowCard key={pick.id} pick={pick} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
  No graded picks returned.
  <div className="mt-2 text-[11px] text-white/40">
    User ID: {p.userId || "missing"} • Week: {selectedMatchweek ?? currentMatchweek ?? "none"}
  </div>
</div>
          )}
        </div>
      ) : null}
    </div>
  );
})}

              {!rows.length && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/50">
                  No leaderboard data found.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  const isPts = label.toLowerCase().includes("pt");

  return (
    <div
      className={`rounded-xl px-3 py-2 text-center border ${
        isPts
          ? "border-blue-400/40 bg-blue-500/10 shadow-[0_0_18px_rgba(59,130,246,0.35)]"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div
        className={`text-[10px] uppercase ${
          isPts ? "text-blue-300" : "text-white/40"
        }`}
      >
        {label}
      </div>

      <div
        className={`font-bold ${
          isPts
            ? "text-blue-400 text-lg drop-shadow-[0_0_8px_rgba(59,130,246,0.9)]"
            : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}