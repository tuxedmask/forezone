"use client";

import { useState } from "react";
import { getTeamLogo } from "@/lib/soccerTeams";
import { getProjectedPointsFromScores } from "@/lib/soccerProjectedPoints";

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
  btts_yes_odds?: number | null;
  btts_no_odds?: number | null;
  over_2_5_odds?: number | null;
  under_2_5_odds?: number | null;
  home_win_odds?: number | null;
  draw_odds?: number | null;
  away_win_odds?: number | null;
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

export function PickRowCard({ pick }: { pick: WeeklyPredictionPick }) {
  const hasResult =
    typeof pick.actual_home_score === "number" &&
    typeof pick.actual_away_score === "number";
 const exactHit =
  hasResult &&
  pick.predicted_home_score === pick.actual_home_score &&
  pick.predicted_away_score === pick.actual_away_score;
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

  function get1x2(home: number, away: number) {
    if (home > away) return "1";
    if (home < away) return "2";
    return "X";
  }

  function get1x2Label(value: "1" | "X" | "2") {
    if (value === "1") return "Home";
    if (value === "2") return "Away";
    return "Draw";
  }

  function getOU(home: number, away: number) {
    return home + away > 2.5 ? "Over" : "Under";
  }

  function getBTTS(home: number, away: number) {
    return home > 0 && away > 0 ? "Yes" : "No";
  }

  const predHome = pick.predicted_home_score ?? 0;
  const predAway = pick.predicted_away_score ?? 0;

  const predicted1x2 = get1x2(predHome, predAway);
  const predictedOU = getOU(predHome, predAway);
  const predictedBTTS = getBTTS(predHome, predAway);

  const projectedPoints =
    pick.predicted_home_score !== null &&
    pick.predicted_away_score !== null
      ? getProjectedPointsFromScores({
          homeScore: pick.predicted_home_score,
          awayScore: pick.predicted_away_score,
          btts_yes_odds: pick.btts_yes_odds ?? null,
          btts_no_odds: pick.btts_no_odds ?? null,
          over_2_5_odds: pick.over_2_5_odds ?? null,
          under_2_5_odds: pick.under_2_5_odds ?? null,
          home_win_odds: pick.home_win_odds ?? null,
          draw_odds: pick.draw_odds ?? null,
          away_win_odds: pick.away_win_odds ?? null,
        })
      : null;

  const displayPoints =
    pick.points !== null && pick.points !== undefined
      ? Number(pick.points)
      : Number(projectedPoints?.total || 0);

  const actual1x2 = hasResult
    ? get1x2(pick.actual_home_score!, pick.actual_away_score!)
    : null;

  const actualOU = hasResult
    ? getOU(pick.actual_home_score!, pick.actual_away_score!)
    : null;

  const actualBTTS = hasResult
    ? getBTTS(pick.actual_home_score!, pick.actual_away_score!)
    : null;

  const correct1x2 = hasResult && predicted1x2 === actual1x2;
  const correctOU = hasResult && predictedOU === actualOU;
  const correctBTTS = hasResult && predictedBTTS === actualBTTS;

  const wrong1x2 = hasResult && !correct1x2;
  const wrongOU = hasResult && !correctOU;
  const wrongBTTS = hasResult && !correctBTTS;
  const wrongCS = hasResult && !exactHit;

  const homeLogo = pick.home_logo || getTeamLogo(pick.home_team);
  const awayLogo = pick.away_logo || getTeamLogo(pick.away_team);

  const badgeItems: { key: string; label: string; icon: string }[] = [];
const coreHits = [
  correctOU,
  correctBTTS,
  correct1x2,
].filter(Boolean).length;
  if (exactHit) {
    badgeItems.push({ key: "cs", label: "Perfect", icon: "🎯" });
  }

  if (correctOU) {
    badgeItems.push({
      key: "ou",
      label: predictedOU === "Over" ? "Over" : "Under",
      icon: predictedOU === "Over" ? "⬆️" : "⬇️",
    });
  }

  if (correct1x2) {
    if (predicted1x2 === "1") {
      badgeItems.push({ key: "1x2-home", label: "Home", icon: "🏠" });
    } else if (predicted1x2 === "X") {
      badgeItems.push({ key: "1x2-draw", label: "Draw", icon: "🤝" });
    } else {
      badgeItems.push({ key: "1x2-away", label: "Away", icon: "🚌" });
    }
  }

  if (correctBTTS) {
  badgeItems.push({
    key: "btts",
    label: predictedBTTS === "Yes" ? "BTTS" : "BTTS",
    icon: predictedBTTS === "Yes" ? "✅⚽" : "🚫⚽",
  });
}


function getCardGlow() {
  if (exactHit) {
  return "border-amber-300/80 shadow-[0_0_0_1px_rgba(255,210,80,0.45),0_0_16px_rgba(255,180,40,0.35),0_0_36px_rgba(255,140,0,0.28),0_0_60px_rgba(255,110,0,0.18)]";
}

  if (coreHits === 3) {
    return "border-emerald-300/70 shadow-[0_0_0_1px_rgba(110,231,183,0.22),0_0_24px_rgba(52,211,153,0.28),0_0_55px_rgba(16,185,129,0.18)]";
  }

  if (coreHits === 2) {
    return "border-emerald-400/55 shadow-[0_0_0_1px_rgba(74,222,128,0.16),0_0_18px_rgba(74,222,128,0.18),0_0_38px_rgba(34,197,94,0.12)]";
  }

  if (coreHits === 1) {
    return "border-yellow-300/45 shadow-[0_0_0_1px_rgba(253,224,71,0.14),0_0_16px_rgba(250,204,21,0.16),0_0_34px_rgba(250,204,21,0.10)]";
  }

  return "border-[#31294c] shadow-[0_0_24px_rgba(0,0,0,0.14)] hover:border-indigo-300/30 hover:shadow-[0_0_35px_rgba(99,102,241,0.18)]";
}

  function StatBox({
    label,
    value,
    accent = "default",
    wide = false,
  }: {
    label: string;
    value: React.ReactNode;
    accent?: "default" | "prediction" | "final" | "points" | "hit" | "miss";
    wide?: boolean;
  }) {
    const styles = {
      default: "border-white/8 bg-white/[0.04] text-white",
      prediction: "border-indigo-400/20 bg-indigo-500/10 text-white",
      final: "border-emerald-400/20 bg-emerald-500/10 text-white",
      points:
        "border-cyan-400/30 bg-cyan-500/10 text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.10)]",
      hit:
        "border-emerald-400/40 bg-emerald-500/15 text-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.14)]",
      miss:
        "border-red-400/35 bg-red-500/10 text-red-200 shadow-[0_0_14px_rgba(248,113,113,0.12)]",
    };

    return (
      <div
        className={`rounded-[18px] border text-center ${styles[accent]} ${
          wide
            ? "flex min-h-[72px] w-full flex-col items-center justify-center px-3 py-2"
            : "min-w-[78px] px-3 py-2"
        }`}
      >
        <div className="text-[9px] uppercase tracking-[0.16em] text-[#9f96c7]">
          {label}
        </div>
        <div
          className={`mt-1 font-black leading-none ${
            wide ? "text-[1.3rem]" : "text-[0.95rem]"
          }`}
        >
          {value}
        </div>
      </div>
    );
  }

  return (
<div
  className={`group relative isolate overflow-visible rounded-[26px] border bg-[linear-gradient(180deg,#171226,#0f0b19)] p-4 transition-all duration-300 ${getCardGlow()}`}
>
 {exactHit ? (
  <>
    

   

    {/* HOT INNER GLOW */}
    <div
      className="pointer-events-none absolute inset-[-3px] z-0 rounded-[30px] shadow-[0_0_55px_rgba(255,170,20,0.75),0_0_120px_rgba(255,80,0,0.55)]"
      style={{ animation: "emberPulse 1.1s ease-in-out infinite" }}
    />

    
  </>
) : null}


       {badgeItems.length > 0 ? (
  <div className="absolute left-4 -top-3 z-20 flex flex-wrap gap-2">
    {badgeItems.map((badge) => (
      <div
  key={badge.key}
  className={`inline-flex items-center gap-1.5 rounded-full bg-[#0f0b19] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
    badge.key === "cs"
  ? "border border-amber-300/80 text-amber-100 shadow-[0_0_20px_rgba(255,200,0,0.45),0_0_35px_rgba(255,140,0,0.35)]"
      : "border border-emerald-400/40 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.18)]"
  }`}
>
        <span className="text-xs">{badge.icon}</span>
        <span>{badge.label}</span>
      </div>
    ))}
  </div>
) : null}

<div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">        {/* LEFT */}
        <div className="min-w-0 xl:flex-[1.05] xl:pr-3">
          <div className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9f96c7]">
            {formatKickoff(pick.kickoff_time ?? null)}
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-indigo-400/25 bg-indigo-500/10">
                {homeLogo ? (
                  <img
                    src={homeLogo}
                    alt={pick.home_team || "Home team"}
                    className="h-[72%] w-[72%] object-contain"
                  />
                ) : (
                  <span className="text-xs font-black text-white">
                    {getTeamShortName(pick.home_team)}
                  </span>
                )}
              </div>

              <div className="mt-2 text-[14px] font-bold leading-tight text-white">
                {pick.home_team || "Home"}
              </div>

              <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#8f87ae]">
                Home
              </div>
            </div>

            <div className="pt-5 text-center text-[11px] font-black uppercase tracking-[0.18em] text-[#8f87ae]">
              vs
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-cyan-400/25 bg-cyan-500/10">
                {awayLogo ? (
                  <img
                    src={awayLogo}
                    alt={pick.away_team || "Away team"}
                    className="h-[72%] w-[72%] object-contain"
                  />
                ) : (
                  <span className="text-xs font-black text-white">
                    {getTeamShortName(pick.away_team)}
                  </span>
                )}
              </div>

              <div className="mt-2 text-[14px] font-bold leading-tight text-white">
                {pick.away_team || "Away"}
              </div>

              <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#8f87ae]">
                Away
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 xl:shrink-0 xl:grid-cols-4">
          <StatBox
            label="Pred"
            value={`${pick.predicted_home_score ?? "-"} - ${pick.predicted_away_score ?? "-"}`}
            accent="prediction"
            wide
          />

          <StatBox
            label="Final"
            value={`${pick.actual_home_score ?? "-"} - ${pick.actual_away_score ?? "-"}`}
            accent="final"
            wide
          />

          <div className="col-span-2">
            <StatBox
              label="Pts"
              value={displayPoints.toFixed(2)}
              accent="points"
              wide
            />
          </div>

          <StatBox
            label="O/U"
            value={predictedOU}
            accent={correctOU ? "hit" : wrongOU ? "miss" : "default"}
          />

          <StatBox
            label="BTTS"
            value={predictedBTTS}
            accent={correctBTTS ? "hit" : wrongBTTS ? "miss" : "default"}
          />

          <StatBox
            label="1X2"
            value={get1x2Label(predicted1x2)}
            accent={correct1x2 ? "hit" : wrong1x2 ? "miss" : "default"}
          />

          <StatBox
  label="CS"
  value={hasResult ? (exactHit ? "🎯" : "-") : "-"}
  accent={exactHit ? "hit" : wrongCS ? "miss" : "default"}
/>
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

  const correctScores = entry.picks.filter((pick) => {
  const hasActualResult =
    typeof pick.actual_home_score === "number" &&
    typeof pick.actual_away_score === "number";

  const hasPrediction =
    typeof pick.predicted_home_score === "number" &&
    typeof pick.predicted_away_score === "number";

  return (
    hasActualResult &&
    hasPrediction &&
    pick.predicted_home_score === pick.actual_home_score &&
    pick.predicted_away_score === pick.actual_away_score
  );
}).length;

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
              <div className="grid gap-6">
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

function FlameStyles() {
  return (
    <style jsx global>{`
      @keyframes flameFlickerOuter {
        0%, 100% {
          transform: scale(1) rotate(0deg);
          opacity: 0.78;
          filter: blur(22px);
        }
        20% {
          transform: scale(1.03) rotate(-0.7deg);
          opacity: 0.95;
          filter: blur(26px);
        }
        50% {
          transform: scale(1.08) rotate(0.8deg);
          opacity: 1;
          filter: blur(30px);
        }
        75% {
          transform: scale(1.04) rotate(-0.5deg);
          opacity: 0.88;
          filter: blur(24px);
        }
      }

      @keyframes flameFlickerInner {
        0%, 100% {
          transform: scale(1);
          opacity: 0.72;
          filter: blur(6px);
        }
        35% {
          transform: scale(1.025);
          opacity: 0.95;
          filter: blur(9px);
        }
        65% {
          transform: scale(1.04);
          opacity: 1;
          filter: blur(11px);
        }
      }

      @keyframes emberPulse {
        0%, 100% {
          opacity: 0.75;
          transform: scale(1);
        }
        50% {
          opacity: 1;
          transform: scale(1.02);
        }
      }

      @keyframes emberDrift1 {
        0% {
          transform: translateY(0px) translateX(0px) scale(0.9);
          opacity: 0;
        }
        20% {
          opacity: 1;
        }
        100% {
          transform: translateY(-26px) translateX(10px) scale(1.15);
          opacity: 0;
        }
      }

      @keyframes emberDrift2 {
        0% {
          transform: translateY(0px) translateX(0px) scale(0.85);
          opacity: 0;
        }
        25% {
          opacity: 1;
        }
        100% {
          transform: translateY(-22px) translateX(-8px) scale(1.1);
          opacity: 0;
        }
      }

      @keyframes emberDrift3 {
        0% {
          transform: translateY(0px) translateX(0px) scale(0.8);
          opacity: 0;
        }
        20% {
          opacity: 1;
        }
        100% {
          transform: translateY(-30px) translateX(6px) scale(1.2);
          opacity: 0;
        }
      }
    `}</style>
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
  <>
    <FlameStyles />
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
    </>
  );
}