"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

type RangeType = "weekly" | "monthly" | "all";

type LeaderboardRow = {
  rank?: number;
  userId?: string | null;
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

function getRangeLabel(range: RangeType) {
  if (range === "weekly") return "Weekly";
  if (range === "monthly") return "Monthly";
  return "All-Time";
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
  return (row.userName || "User").trim() || "User";
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

function formatStreak(streak?: number | null) {
  if (streak === null || streak === undefined) return "—";
  if (streak === 0) return "0";
  return `${streak > 0 ? "+" : ""}${streak}`;
}

function getGlow(index: number) {
  if (index === 0) return "from-yellow-500/20 border-yellow-400/40";
  if (index === 1) return "from-slate-300/15 border-slate-300/30";
  if (index === 2) return "from-orange-400/20 border-orange-400/30";
  return "from-indigo-500/10 border-white/10";
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
  if (row.totalPoints !== undefined && row.totalPoints !== null) {
    return Number(row.totalPoints);
  }
  return Number(row.units ?? 0);
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

export default function LeaderboardPage() {
  const { data: session } = useSession();

  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeType>("weekly");
  const [matchweek, setMatchweek] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      try {
        let currentMW: number | null = null;

        const mwRes = await fetch(
          "/api/soccer/predictions/premier-league/matchweek",
          { cache: "no-store" }
        );
        const mwData = await mwRes.json();

        currentMW = Number(mwData?.matchday ?? mwData?.matchweek ?? 0) || null;

        if (!active) return;
        setMatchweek(currentMW);

        const url =
          range === "weekly"
            ? `/api/soccer/leaderboard?leagueSlug=premier-league&range=weekly&matchweek=${currentMW ?? ""}`
            : `/api/soccer/leaderboard?leagueSlug=premier-league&range=${range}`;

        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();

        if (!active) return;

        setRows(Array.isArray(data) ? data : data?.leaderboard || []);
      } catch (error) {
        console.error("Failed to load leaderboard:", error);
        if (active) setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [range]);

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

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-[#0b1024] via-[#101733] to-[#111936] p-6 shadow-[0_0_40px_rgba(99,102,241,0.2)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-indigo-300/15 bg-indigo-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-200">
                ForeZone Soccer
              </div>

              <h1 className="mt-3 text-4xl font-black tracking-tight">
                Leaderboard
              </h1>

              <p className="mt-2 text-white/60">
                {getRangeLabel(range)} rankings — climb the ladder
              </p>

              <p className="mt-1 text-xs text-indigo-300/60">
                Current Matchweek: {matchweek ?? "—"}
              </p>
            </div>

            <div className="flex gap-2">
              {(["weekly", "monthly", "all"] as RangeType[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                    range === r
                      ? "bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.6)]"
                      : "border border-white/10 bg-white/5 hover:bg-indigo-500/20"
                  }`}
                >
                  {getRangeLabel(r)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {currentUserRow && (
          <div className="mt-6 rounded-3xl border border-emerald-400/30 bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-transparent p-[1px] shadow-[0_0_24px_rgba(16,185,129,0.18)]">
            <div className="rounded-[calc(1.5rem-1px)] bg-[#0b1124]/95 p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                    Your Position
                  </div>
                  <div className="mt-1 text-2xl font-black">
                    {currentUserRow.rank
                      ? `#${currentUserRow.rank}`
                      : `#${
                          rows.findIndex((r) => r.userId === currentUserRow.userId) + 1
                        }`}
                  </div>
                </div>

                <div className="rounded-full border border-emerald-300/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-200">
                  Highlighted
                </div>
              </div>

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  {currentUserRow.userImage ? (
                    <Image
                      src={currentUserRow.userImage}
                      alt={getSafeName(currentUserRow)}
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-2xl border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-indigo-500/20 font-black text-indigo-100">
                      {getInitials(currentUserRow.userName)}
                    </div>
                  )}

                  <div>
                    <div className="text-lg font-black">
                      {getSafeName(currentUserRow)}
                    </div>
                    <div className="text-sm text-white/50">
                      Record: {getRecordValue(currentUserRow)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <Stat label="Pts" value={getPointsValue(currentUserRow)} />
                  <Stat label="Win%" value={`${getWinPctValue(currentUserRow)}%`} />
                  <Stat label="Correct" value={currentUserRow.correctScores ?? 0} />
                  <Stat label="Pending" value={currentUserRow.pending ?? 0} />
                  <Stat label="Picks" value={currentUserRow.picksCount ?? 0} />
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && top3.length > 0 && (
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {top3.map((p, i) => (
              <div
                key={p.userId || `top-${i}`}
                className={`rounded-3xl border bg-gradient-to-br p-5 ${getGlow(i)} ${
                  isCurrentUserRow(p, session)
                    ? "ring-2 ring-emerald-400/60 shadow-[0_0_24px_rgba(16,185,129,0.2)]"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-lg font-black">{getRankIcon(i)}</div>

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
                    <div className="font-bold">{getSafeName(p)}</div>
                    <div className="text-sm text-white/50">{getRecordValue(p)}</div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Stat label="Points" value={getPointsValue(p)} />
                  <Stat label="Win %" value={`${getWinPctValue(p)}%`} />
                  <Stat label="Correct" value={p.correctScores ?? 0} />
                  <Stat label="Pending" value={p.pending ?? 0} />
                </div>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        )}

        {!loading && (
          <div className="mt-6 space-y-3">
            {rows.map((p, i) => {
              const currentUser = isCurrentUserRow(p, session);

              return (
                <div
                  key={p.userId || `row-${i}`}
                  className={`rounded-2xl border p-4 transition ${
                    currentUser
                      ? "border-emerald-400/35 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.14)]"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 font-bold ${currentUser ? "text-emerald-300" : ""}`}
                      >
                        {getRankIcon(i)}
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
                          <div className="font-bold">{getSafeName(p)}</div>
                          {currentUser && (
                            <span className="rounded-full border border-emerald-300/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-200">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-white/50">
                          Record: {getRecordValue(p)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:mt-0">
                      <Stat label="Pts" value={getPointsValue(p)} />
                      <Stat label="Win%" value={`${getWinPctValue(p)}%`} />
                      <Stat label="Correct" value={p.correctScores ?? 0} />
                      <Stat label="Pending" value={p.pending ?? 0} />
                      <Stat label="Picks" value={p.picksCount ?? 0} />
                    </div>
                  </div>
                </div>
              );
            })}

            {!rows.length && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/50">
                No leaderboard data found.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">
      <div className="text-[10px] uppercase text-white/40">{label}</div>
      <div className="font-bold">{value}</div>
    </div>
  );
}