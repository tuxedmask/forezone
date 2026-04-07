"use client";

import { useState } from "react";
import { getTeamLogo } from "@/lib/soccerTeams";

export type WeeklyPredictionPick = {
  id: string;
  entry_id: string;
  match_id: string | null;
  home_team: string | null;
  away_team: string | null;
  predicted_home_score: number | null;
  predicted_away_score: number | null;
  actual_home_score: number | null;
  actual_away_score: number | null;
  points: number | null;
  correct_score_points: number | null;
  graded: boolean | null;
  home_logo?: string | null;
  away_logo?: string | null;
  kickoff_time?: string | null;
};

export type WeeklyEntryWithPicks = {
  id: string;
  leagueLabel: string;
  leagueSlug: string | null;
  matchweekLabel: string | null;
  status: string | null;
  createdAt: string | null;
  submittedAt: string | null;
  totalPoints: number;
  graded: boolean;
  picks: WeeklyPredictionPick[];
};

function formatDateTime(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  }).format(date);
}

function formatKickoff(value: string | null) {
  if (!value) return "Kickoff TBD";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  }).format(date);
}

function getStatusBadge(graded: boolean, status: string | null) {
  if (graded) {
    return "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300";
  }

  if (status === "submitted") {
    return "border border-amber-400/30 bg-amber-500/15 text-amber-300";
  }

  return "border border-zinc-600 bg-zinc-700/30 text-zinc-300";
}

function getStatusLabel(graded: boolean, status: string | null) {
  if (graded) return "Graded";
  if (status === "submitted") return "Pending";
  return status || "Pending";
}

function getWeekNumber(label: string | null) {
  if (!label) return 0;
  const match = label.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-5 w-5 text-[#d1cbf0] transition-transform duration-300 ${
        open ? "rotate-180" : "rotate-0"
      }`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function getTeamShortName(name: string | null) {
  if (!name) return "--";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function TeamDisplay({
  team,
  side,
  logo,
}: {
  team: string | null;
  side: "home" | "away";
  logo?: string | null;
}) {
  const fallbackLogo = getTeamLogo(team);
  const finalLogo = logo || fallbackLogo;

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border shadow-[0_0_18px_rgba(0,0,0,0.14)] sm:h-16 sm:w-16 ${
          side === "home"
            ? "border-indigo-400/25 bg-indigo-500/10"
            : "border-cyan-400/25 bg-cyan-500/10"
        }`}
      >
        {finalLogo ? (
          <img
            src={finalLogo}
            alt={team || "team"}
            className="h-[72%] w-[72%] object-contain"
          />
        ) : (
          <span className="text-xs font-black tracking-wide text-white">
            {getTeamShortName(team)}
          </span>
        )}
      </div>

      <div className="mt-2 max-w-[120px] text-sm font-bold text-white">
        {team || "Unknown Team"}
      </div>

      <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#8f87ae]">
        {side}
      </div>
    </div>
  );
}

function BigScoreRow({
  title,
  homeScore,
  awayScore,
  accent,
}: {
  title: string;
  homeScore: number | null;
  awayScore: number | null;
  accent: "prediction" | "final";
}) {
  const accentClass =
    accent === "prediction"
      ? "border-indigo-400/25 bg-indigo-500/10"
      : "border-emerald-400/25 bg-emerald-500/10";

  return (
    <div className={`rounded-2xl border ${accentClass} p-3`}>
      <div className="text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9f96c7]">
        {title}
      </div>

      <div className="mt-3 flex items-center justify-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-xl font-black text-white sm:h-14 sm:w-14 sm:text-2xl">
          {homeScore ?? "-"}
        </div>

        <div className="text-lg font-black text-[#8e86aa]">-</div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-xl font-black text-white sm:h-14 sm:w-14 sm:text-2xl">
          {awayScore ?? "-"}
        </div>
      </div>
    </div>
  );
}

function PickRowCard({ pick }: { pick: WeeklyPredictionPick }) {
  const exactHit =
    Boolean(pick.graded) &&
    pick.predicted_home_score === pick.actual_home_score &&
    pick.predicted_away_score === pick.actual_away_score;

  const points = Number(pick.points || 0);

  function formatKickoff(value: string | null) {
    if (!value) return "Kickoff TBD";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return (
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/New_York",
      }).format(date) + " ET"
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-[#31294c] bg-[linear-gradient(180deg,#171226,#0f0b19)] shadow-[0_0_24px_rgba(0,0,0,0.14)] transition-all duration-300 hover:shadow-[0_0_35px_rgba(99,102,241,0.18)]">

      {/* 🔥 BULLSEYE BADGE */}
      {exactHit ? (
        <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.18)] transition-all duration-300 group-hover:shadow-[0_0_18px_rgba(52,211,153,0.35)] group-hover:scale-105">
          <span className="text-sm">🎯</span>
          <span>Correct</span>
        </div>
      ) : null}

      <div className="px-4 py-5">

        {/* ⏱️ KICKOFF TIME */}
        <div className="mb-4 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9f96c7]">
          {formatKickoff(pick.kickoff_time ?? null)}
        </div>

        {/* MATCH */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
          <TeamDisplay
            team={pick.home_team}
            side="home"
            logo={pick.home_logo}
          />

          <div className="pt-5 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8f87ae]">
              Match
            </div>
            <div className="mt-2 text-base font-black text-white">vs</div>
          </div>

          <TeamDisplay
            team={pick.away_team}
            side="away"
            logo={pick.away_logo}
          />
        </div>

        {/* SCORES */}
        <div className="mt-5 grid gap-3">
          <BigScoreRow
            title="Prediction"
            homeScore={pick.predicted_home_score}
            awayScore={pick.predicted_away_score}
            accent="prediction"
          />

          <BigScoreRow
            title="Final Score"
            homeScore={pick.graded ? pick.actual_home_score : null}
            awayScore={pick.graded ? pick.actual_away_score : null}
            accent="final"
          />

          {/* POINTS */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9f96c7]">
              Points
            </div>

            <div
              className={`mt-3 text-3xl font-black leading-none tracking-tight ${
                points > 0
                  ? "text-indigo-300 drop-shadow-[0_0_14px_rgba(129,140,248,0.25)]"
                  : "text-white/35"
              }`}
            >
              {points.toFixed(2)}
            </div>

            {pick.graded ? (
              <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9f96c7]">
                Graded
              </div>
            ) : (
              <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                Pending
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function WeeklyEntryCard({
  entry,
  isCurrentWeek,
}: {
  entry: WeeklyEntryWithPicks;
  isCurrentWeek: boolean;
}) {
  const [open, setOpen] = useState(false);

  const correctScores = entry.picks.filter(
    (pick) => Number(pick.correct_score_points || 0) > 0
  ).length;

  return (
    <div
      className={`overflow-hidden rounded-[28px] border bg-[linear-gradient(180deg,#151125,#0d0a17)] transition ${
        isCurrentWeek
          ? "border-indigo-300/60 shadow-[0_0_0_1px_rgba(165,180,252,0.18),0_0_45px_rgba(99,102,241,0.24),0_0_90px_rgba(99,102,241,0.12)]"
          : "border-[#31294c] shadow-[0_0_30px_rgba(0,0,0,0.18)]"
      }`}
    >
      {isCurrentWeek ? (
        <div className="h-[2px] w-full bg-gradient-to-r from-indigo-400/0 via-indigo-300 to-indigo-400/0" />
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full px-5 py-5 text-left transition hover:bg-white/[0.02] sm:px-6"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9f96c7]">
                {entry.leagueLabel}
              </div>

              {isCurrentWeek ? (
                <span className="inline-flex rounded-full border border-indigo-300/40 bg-indigo-400/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-100 shadow-[0_0_18px_rgba(129,140,248,0.22)]">
                  Current Week
                </span>
              ) : null}
            </div>

            <h4 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              {entry.matchweekLabel || "Matchweek"}
            </h4>

            <div className="mt-2 text-sm text-[#9f96c7]">
              {entry.picks.length} game{entry.picks.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(
                entry.graded,
                entry.status
              )}`}
            >
              {getStatusLabel(entry.graded, entry.status)}
            </span>

            <div className="flex items-end gap-5">
              <div className="text-left sm:text-right">
                <div
                  className={`text-4xl font-black tracking-tight ${
                    entry.totalPoints > 0
                      ? "text-indigo-300 drop-shadow-[0_0_14px_rgba(129,140,248,0.20)]"
                      : "text-white/35"
                  }`}
                >
                  {entry.totalPoints.toFixed(2)}
                </div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-[#9f96c7]">
                  week points
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div
                  className={`text-3xl font-black tracking-tight ${
                    correctScores > 0
                      ? "text-emerald-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.18)]"
                      : "text-white/35"
                  }`}
                >
                  {correctScores}
                </div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-[#9f96c7]">
                  correct
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-white/6 pt-4">
          <div className="flex flex-col items-center justify-center text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d1cbf0] transition hover:text-white">
            <span className="text-center">{open ? "Hide games" : "Show games"}</span>
            <div className="mt-1.5">
              <Chevron open={open} />
            </div>
          </div>
        </div>
      </button>

      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-white/6 px-5 py-5 sm:px-6">
            {entry.picks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#31294c] p-5 text-sm text-[#9f96c7]">
                No predictions saved for this entry.
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {entry.picks.map((pick) => (
                  <PickRowCard key={pick.id} pick={pick} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WeeklyPredictionHistory({
  entries,
}: {
  entries: WeeklyEntryWithPicks[];
}) {
  const pendingWeeks = entries
    .filter((entry) => !entry.graded)
    .map((entry) => getWeekNumber(entry.matchweekLabel))
    .filter((week) => week > 0);

  const currentWeekNumber =
    pendingWeeks.length > 0
      ? Math.min(...pendingWeeks)
      : entries.reduce((max, entry) => {
          const weekNumber = getWeekNumber(entry.matchweekLabel);
          return weekNumber > max ? weekNumber : max;
        }, 0);

  return (
    <div className="rounded-2xl border border-[#31294c] bg-[linear-gradient(180deg,#131021,#0b0914)] p-6 shadow-[0_0_30px_rgba(0,0,0,0.16)]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">
            Weekly Score Predictions
          </h3>
          <p className="mt-1 text-sm text-[#9f96c7]">
            {entries.length} matchweek{entries.length === 1 ? "" : "s"} tracked
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#31294c] p-8 text-center text-[#9f96c7]">
          No soccer prediction entries yet.
        </div>
      ) : (
        <div className="space-y-5">
          {entries.map((entry) => (
            <WeeklyEntryCard
              key={entry.id}
              entry={entry}
              isCurrentWeek={getWeekNumber(entry.matchweekLabel) === currentWeekNumber}
            />
          ))}
        </div>
      )}
    </div>
  );
}