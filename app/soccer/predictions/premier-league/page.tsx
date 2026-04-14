"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Match = {
  id: number;
  home: string;
  away: string;
  kickoff: string;
  homeLogo: string;
  awayLogo: string;
  btts_yes_odds: number | null;
  btts_no_odds: number | null;
  over_2_5_odds: number | null;
  under_2_5_odds: number | null;
  home_win_odds: number | null;
  draw_odds: number | null;
  away_win_odds: number | null;
};

type ScorePick = {
  homeScore: string;
  awayScore: string;
  actualHomeScore?: string;
  actualAwayScore?: string;
  graded?: boolean;
  points?: number;
  bttsPoints?: number;
  ouPoints?: number;
  onextwoPoints?: number;
  correctScorePoints?: number;
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

function hasMatchStarted(kickoff: string) {
  const ts = new Date(kickoff).getTime();
  if (Number.isNaN(ts)) return true;
  return Date.now() >= ts;
}

function roundPoints(value: number) {
  return Math.round(value * 100) / 100;
}

function getProjectedPoints(match: Match, pick: ScorePick) {
  const home = Number(pick.homeScore);
  const away = Number(pick.awayScore);

  if (
    pick.homeScore === "" ||
    pick.awayScore === "" ||
    Number.isNaN(home) ||
    Number.isNaN(away)
  ) {
    return null;
  }

  const isDraw = home === away;
  const isHomeWin = home > away;
  const bttsYes = home > 0 && away > 0;
  const totalGoals = home + away;
  const isOver = totalGoals > 2;

  const bttsBonus =
    0.5 *
    Number(bttsYes ? match.btts_yes_odds ?? 0 : match.btts_no_odds ?? 0) *
    10;

  const ouBonus =
    0.5 *
    Number(isOver ? match.over_2_5_odds ?? 0 : match.under_2_5_odds ?? 0) *
    10;

  const onextwoBonus = isHomeWin
    ? 0.2 * Number(match.home_win_odds ?? 0) * 10
    : isDraw
      ? 0.5 * Number(match.draw_odds ?? 0) * 10
      : 0.3 * Number(match.away_win_odds ?? 0) * 10;

  const correctScoreBonus = 17.5 + 17.5 + (isDraw ? 50 : 0);

  const total = bttsBonus + ouBonus + onextwoBonus + correctScoreBonus;

  return {
    bttsBonus: roundPoints(bttsBonus),
    ouBonus: roundPoints(ouBonus),
    onextwoBonus: roundPoints(onextwoBonus),
    correctScoreBonus: roundPoints(correctScoreBonus),
    total: roundPoints(total),
  };
}

function TeamBadge({
  name,
  logo,
  compact = false,
}: {
  name: string;
  logo: string;
  compact?: boolean;
}) {
  const [broken, setBroken] = useState(false);

  const outerSize = compact
    ? "h-10 w-10 rounded-[16px]"
    : "h-24 w-24 rounded-[26px]";
  const innerSize = compact ? "h-7 w-7" : "h-16 w-16";
  const textSize = compact ? "text-sm" : "text-xl";
  const padding = compact ? "p-1.5" : "p-3";

  if (!logo || broken) {
    return (
      <div
        className={`flex ${outerSize} items-center justify-center border border-white/10 bg-gradient-to-br from-white/15 to-white/5 ${textSize} font-black text-white shadow-[0_12px_32px_rgba(0,0,0,0.4)]`}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <div
      className={`relative flex ${outerSize} items-center justify-center border border-white/10 bg-gradient-to-br from-white/15 to-white/5 ${padding} shadow-[0_12px_32px_rgba(0,0,0,0.4)]`}
    >
      <img
        src={logo}
        alt={name}
        className={`${innerSize} object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,0.65)]`}
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
  const numericValue = value === "" ? 0 : Number(value);

  function increase() {
    if (disabled) return;
    const next = Math.min(99, numericValue + 1);
    onChange(String(next));
  }

  function decrease() {
    if (disabled) return;
    const next = Math.max(0, numericValue - 1);
    onChange(String(next));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;

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
      tabIndex={disabled ? -1 : 0}
      aria-valuemin={0}
      aria-valuemax={99}
      aria-valuenow={numericValue}
      onKeyDown={handleKeyDown}
      className={`relative h-20 w-20 overflow-hidden rounded-[22px] border text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03),0_10px_24px_rgba(0,0,0,0.35)] transition ${
        disabled
          ? "cursor-not-allowed border-white/10 bg-black/50 opacity-60"
          : "border-white/10 bg-black/85"
      }`}
    >
      <button
        type="button"
        onClick={increase}
        disabled={disabled}
        className="absolute inset-x-0 top-0 h-1/2 border-b border-white/5 bg-transparent transition hover:bg-white/5 disabled:cursor-not-allowed"
        aria-label="Increase score"
      />

      <button
        type="button"
        onClick={decrease}
        disabled={disabled}
        className="absolute inset-x-0 bottom-0 h-1/2 bg-transparent transition hover:bg-white/5 disabled:cursor-not-allowed"
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

function MatchCard({
  match,
  pick,
  onChange,
  locked,
  leagueName,
  authRequired = false,
  onAuthRequired,
}: {
  match: Match;
  pick: ScorePick;
  onChange: (next: ScorePick) => void;
  locked: boolean;
  leagueName: string;
  authRequired?: boolean;
  onAuthRequired: () => void;
}) {
  const previewReady = pick.homeScore !== "" && pick.awayScore !== "";
  const homeShort = getShortTeamName(match.home);
  const awayShort = getShortTeamName(match.away);

  const isGraded =
  Boolean(pick.graded) ||
  (pick.actualHomeScore !== "" &&
    pick.actualHomeScore !== undefined &&
    pick.actualAwayScore !== "" &&
    pick.actualAwayScore !== undefined);
  const exactHit =
    isGraded &&
    pick.actualHomeScore !== "" &&
    pick.actualAwayScore !== "" &&
    pick.homeScore === pick.actualHomeScore &&
    pick.awayScore === pick.actualAwayScore;

  const homeScoreNum = Number(pick.homeScore);
  const awayScoreNum = Number(pick.awayScore);


  
  const predictionSide = !previewReady
    ? "none"
    : homeScoreNum > awayScoreNum
      ? "home"
      : homeScoreNum < awayScoreNum
        ? "away"
        : "draw";

  const outerGlowClass =
    predictionSide === "home"
      ? "before:absolute before:top-0 before:bottom-0 before:left-0 before:w-[38%] before:bg-[radial-gradient(circle_at_left_center,rgba(16,185,129,0.18),transparent_72%)] before:animate-[pulseGlowLeft_2.8s_ease-in-out_infinite]"
      : predictionSide === "away"
        ? "before:absolute before:top-0 before:bottom-0 before:right-0 before:w-[38%] before:bg-[radial-gradient(circle_at_right_center,rgba(139,92,246,0.18),transparent_72%)] before:animate-[pulseGlowRight_2.8s_ease-in-out_infinite]"
        : "";

  const matchupGlowClass =
    predictionSide === "home"
      ? "before:absolute before:inset-y-0 before:left-0 before:w-[44%] before:bg-[radial-gradient(circle_at_left_center,rgba(16,185,129,0.20),transparent_72%)] before:animate-[pulseGlowLeft_2.8s_ease-in-out_infinite]"
      : predictionSide === "away"
        ? "before:absolute before:inset-y-0 before:right-0 before:w-[44%] before:bg-[radial-gradient(circle_at_right_center,rgba(139,92,246,0.20),transparent_72%)] before:animate-[pulseGlowRight_2.8s_ease-in-out_infinite]"
        : predictionSide === "draw"
          ? "before:absolute before:inset-y-0 before:left-0 before:w-1/2 before:bg-[radial-gradient(circle_at_85%_50%,rgba(34,211,238,0.16),transparent_72%)] before:animate-[pulseDrawSide_2.8s_ease-in-out_infinite] after:absolute after:inset-y-0 after:right-0 after:w-1/2 after:bg-[radial-gradient(circle_at_15%_50%,rgba(34,211,238,0.16),transparent_72%)] after:animate-[pulseDrawSide_2.8s_ease-in-out_infinite]"
          : "";

  const homeAccentClass =
    predictionSide === "home"
      ? "ring-2 ring-emerald-400/40 bg-emerald-500/10 shadow-[0_0_24px_rgba(16,185,129,0.18)] animate-[pulseBadge_2.8s_ease-in-out_infinite]"
      : predictionSide === "draw"
        ? "ring-2 ring-cyan-400/30 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.14)] animate-[pulseDrawBadge_2.8s_ease-in-out_infinite]"
        : "";

  const awayAccentClass =
    predictionSide === "away"
      ? "ring-2 ring-violet-400/40 bg-violet-500/10 shadow-[0_0_24px_rgba(139,92,246,0.18)] animate-[pulseBadge_2.8s_ease-in-out_infinite]"
      : predictionSide === "draw"
        ? "ring-2 ring-cyan-400/30 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.14)] animate-[pulseDrawBadge_2.8s_ease-in-out_infinite]"
        : "";

  const centerAccentClass =
    predictionSide === "draw"
      ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.18)] animate-[pulseDrawCenter_2.8s_ease-in-out_infinite]"
      : "border-white/10 bg-white/5 text-white/45";

  const onextwoLabel =
    homeScoreNum > awayScoreNum
      ? "Home"
      : homeScoreNum < awayScoreNum
        ? "Away"
        : "Draw";

  const ouLabel = homeScoreNum + awayScoreNum > 2 ? "Over" : "Under";
  const bttsLabel = homeScoreNum > 0 && awayScoreNum > 0 ? "Yes" : "No";

const actualHome = Number(pick.actualHomeScore);
const actualAway = Number(pick.actualAwayScore);

const hasResult =
  isGraded &&
  pick.actualHomeScore !== "" &&
  pick.actualAwayScore !== "";

const actual1x2 =
  actualHome > actualAway ? "Home" :
  actualHome < actualAway ? "Away" : "Draw";

const actualOU =
  actualHome + actualAway > 2 ? "Over" : "Under";

const actualBTTS =
  actualHome > 0 && actualAway > 0 ? "Yes" : "No";

const correct1x2 = hasResult && onextwoLabel === actual1x2;
const correctOU = hasResult && ouLabel === actualOU;
const correctBTTS = hasResult && bttsLabel === actualBTTS;
const correctCS =
  hasResult &&
  pick.homeScore === pick.actualHomeScore &&
  pick.awayScore === pick.actualAwayScore;

  const projectedPoints = getProjectedPoints(match, pick);
  const showAuthPrompt = authRequired && !locked;

  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden rounded-[26px] border p-4 backdrop-blur-xl transition ${
        exactHit
          ? "border-emerald-400/40 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.22)]"
          : locked
            ? "border-amber-400/20 bg-amber-500/5"
            : "border-white/10 bg-white/5 hover:border-emerald-400/20 hover:bg-white/[0.07]"
      } ${outerGlowClass}`}
    >
      <div className="relative z-10 flex h-full flex-col">
        {exactHit ? (
          <div className="absolute right-0 top-0 z-20 rounded-bl-2xl rounded-tr-[22px] border border-emerald-300/30 bg-emerald-400/15 px-3 py-1.5 text-sm font-black text-emerald-200 shadow-[0_0_18px_rgba(16,185,129,0.28)]">
            🎯 Bullseye
          </div>
        ) : null}

        <div className="text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200">
            {leagueName}
          </div>
          <div className="mt-1.5 text-sm text-white/55">
            {formatKickoff(match.kickoff)}
          </div>

          {locked ? (
            <div className="mt-2 inline-flex rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-200">
              Locked
            </div>
          ) : showAuthPrompt ? (
            <button
              type="button"
              onClick={onAuthRequired}
              className="mt-2 inline-flex rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold text-cyan-200 transition hover:bg-cyan-500/15"
            >
              Sign in to edit
            </button>
          ) : null}
        </div>

        <div
          className={`relative mt-4 flex-1 rounded-[24px] border border-white/10 bg-black/20 px-4 py-5 ${matchupGlowClass}`}
        >
          <div className="relative z-10 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2">
            <div className="flex min-w-0 flex-col items-center text-center">
              <div className={`rounded-[28px] p-1 transition ${homeAccentClass}`}>
                <TeamBadge name={match.home} logo={match.homeLogo} />
              </div>
              <div className="mt-3 text-xs uppercase tracking-[0.18em] text-white/35">
                Home
              </div>
              <div className="mt-1.5 w-full max-w-[140px] text-center text-[1.05rem] font-extrabold leading-tight text-white whitespace-normal break-normal">
                {homeShort}
              </div>
            </div>

            <div className="flex items-center justify-center pt-6">
              <div
                className={`rounded-full border px-4 py-2 text-xs font-bold tracking-[0.28em] transition ${centerAccentClass}`}
              >
                VS
              </div>
            </div>

            <div className="flex min-w-0 flex-col items-center text-center">
              <div className={`rounded-[28px] p-1 transition ${awayAccentClass}`}>
                <TeamBadge name={match.away} logo={match.awayLogo} />
              </div>
              <div className="mt-3 text-xs uppercase tracking-[0.18em] text-white/35">
                Away
              </div>
              <div className="mt-1.5 w-full max-w-[140px] text-center text-[1.05rem] font-extrabold leading-tight text-white whitespace-normal break-normal">
                {awayShort}
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-5 rounded-[22px] border border-cyan-400/10 bg-[#03060d] px-4 py-4">
            {showAuthPrompt ? (
              <button
                type="button"
                onClick={onAuthRequired}
                className="absolute inset-0 z-20 rounded-[22px]"
                aria-label="Sign in to edit this prediction"
              />
            ) : null}

            <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200/75">
              Your Pick
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="flex justify-center">
                <ScoreInput
                  value={pick.homeScore}
                  disabled={locked || showAuthPrompt}
                  onChange={(value) =>
                    onChange({
                      ...pick,
                      homeScore: value,
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
                  value={pick.awayScore}
                  disabled={locked || showAuthPrompt}
                  onChange={(value) =>
                    onChange({
                      ...pick,
                      awayScore: value,
                    })
                  }
                />
              </div>
            </div>

            {isGraded &&
            pick.actualHomeScore !== "" &&
            pick.actualAwayScore !== "" ? (
              <div className="mt-3 rounded-[22px] border border-emerald-400/20 bg-emerald-500/10 px-4 py-4">
                <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-200/85">
                  Result
                </div>

                <div className="flex items-center justify-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[18px] border border-white/10 bg-black/70 text-4xl font-black text-white">
                    {pick.actualHomeScore}
                  </div>
                  <div className="text-3xl font-bold text-white">:</div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-[18px] border border-white/10 bg-black/70 text-4xl font-black text-white">
                    {pick.actualAwayScore}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {isGraded ? (
          <div className="mt-2.5">
            <div className="flex items-center justify-center rounded-[18px] border border-cyan-400/20 bg-cyan-500/10 px-4 py-3">
              <span className="text-sm font-semibold text-cyan-200">
                Earned:
              </span>
              <span className="ml-2 text-lg font-black text-white">
  {(
    Number(pick.onextwoPoints ?? 0) +
    Number(pick.ouPoints ?? 0) +
    Number(pick.bttsPoints ?? 0) +
    Number(pick.correctScorePoints ?? 0)
  ).toFixed(2)}
</span>
              <span className="ml-1 text-sm text-cyan-300">pts</span>
            </div>
          </div>
        ) : projectedPoints ? (
          <div className="mt-2.5">
            <div className="flex items-center justify-center rounded-[18px] border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
              <span className="text-sm font-semibold text-emerald-200">
                Projected:
              </span>
              <span className="ml-2 text-lg font-black text-white">
                {projectedPoints.total}
              </span>
              <span className="ml-1 text-sm text-emerald-300">pts</span>
            </div>
          </div>
        ) : null}

        <div className="mt-3">
          {previewReady ? (
  <div className="rounded-[18px] border border-white/10 bg-white/[0.06] px-3 py-3">
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">

      {/* 1X2 */}
      <div
        className={`flex flex-col items-center justify-center rounded-xl py-2 text-center ${
          isGraded
            ? correct1x2
              ? "bg-emerald-500/15 border border-emerald-400/40 shadow-[0_0_16px_rgba(16,185,129,0.35)]"
              : "bg-red-500/10 border border-red-400/40 shadow-[0_0_14px_rgba(248,113,113,0.25)]"
            : "bg-black/40"
        }`}
      >
        <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">
          1X2
        </div>
        <div className="mt-1 text-sm font-semibold text-white">
          {onextwoLabel}
        </div>
        {isGraded ? (
          <div className="mt-1 text-xs font-semibold text-white">
            +{(Number(pick.onextwoPoints ?? 0)).toFixed(2)}
          </div>
        ) : projectedPoints && projectedPoints.onextwoBonus > 0 ? (
          <div className="mt-1 text-xs font-semibold text-emerald-300">
            +{projectedPoints.onextwoBonus}
          </div>
        ) : null}
      </div>

      {/* O/U */}
      <div
        className={`flex flex-col items-center justify-center rounded-xl py-2 text-center ${
          isGraded
            ? correctOU
              ? "bg-emerald-500/15 border border-emerald-400/40 shadow-[0_0_16px_rgba(16,185,129,0.35)]"
              : "bg-red-500/10 border border-red-400/40 shadow-[0_0_14px_rgba(248,113,113,0.25)]"
            : "bg-black/40"
        }`}
      >
        <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">
          O/U 2.5
        </div>
        <div className="mt-1 text-sm font-semibold text-white">
          {ouLabel}
        </div>
        {isGraded ? (
          <div className="mt-1 text-xs font-semibold text-white">
            +{(Number(pick.ouPoints ?? 0)).toFixed(2)}
          </div>
        ) : projectedPoints && projectedPoints.ouBonus > 0 ? (
          <div className="mt-1 text-xs font-semibold text-emerald-300">
            +{projectedPoints.ouBonus}
          </div>
        ) : null}
      </div>

      {/* BTTS */}
      <div
        className={`flex flex-col items-center justify-center rounded-xl py-2 text-center ${
          isGraded
            ? correctBTTS
              ? "bg-emerald-500/15 border border-emerald-400/40 shadow-[0_0_16px_rgba(16,185,129,0.35)]"
              : "bg-red-500/10 border border-red-400/40 shadow-[0_0_14px_rgba(248,113,113,0.25)]"
            : "bg-black/40"
        }`}
      >
        <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">
          BTTS
        </div>
        <div className="mt-1 text-sm font-semibold text-white">
          {bttsLabel}
        </div>
        {isGraded ? (
          <div className="mt-1 text-xs font-semibold text-white">
            +{(Number(pick.bttsPoints ?? 0)).toFixed(2)}
          </div>
        ) : projectedPoints && projectedPoints.bttsBonus > 0 ? (
          <div className="mt-1 text-xs font-semibold text-emerald-300">
            +{projectedPoints.bttsBonus}
          </div>
        ) : null}
      </div>

      {/* CS */}
      <div
        className={`flex flex-col items-center justify-center rounded-xl py-2 text-center ${
          isGraded
            ? correctCS
              ? "bg-emerald-500/20 border border-emerald-300/60 shadow-[0_0_22px_rgba(16,185,129,0.45)]"
              : "bg-red-500/10 border border-red-400/40 shadow-[0_0_14px_rgba(248,113,113,0.25)]"
            : "bg-emerald-500/10"
        }`}
      >
        <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">
          CS
        </div>
        <div className="mt-1 text-sm font-bold text-white">
          +
          {isGraded
            ? (Number(pick.correctScorePoints ?? 0)).toFixed(2)
            : Number(projectedPoints?.correctScoreBonus ?? 0).toFixed(2)}
        </div>
      </div>

    </div>
  </div>
) : (
            <div className="rounded-[18px] border border-white/10 bg-white/[0.05] px-3 py-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {["1X2", "O/U 2.5", "BTTS", "CS"].map((label) => (
                  <div
                    key={label}
                    className="flex items-center justify-center rounded-xl bg-black/30 py-2 text-[10px] uppercase tracking-[0.18em] text-white/35"
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PremierLeaguePredictionsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [matches, setMatches] = useState<Match[]>([]);
  const [leagueName, setLeagueName] = useState("Premier League");
  const [matchweekLabel, setMatchweekLabel] = useState<string | null>(null);
  const [selectedMatchweek, setSelectedMatchweek] = useState("");
  const [matchweekMenuOpen, setMatchweekMenuOpen] = useState(false);
  const [availableMatchweeks, setAvailableMatchweeks] = useState<
    MatchweekOption[]
  >([]);

  const [picks, setPicks] = useState<Record<number, ScorePick>>({});
  const [loadingMatchweek, setLoadingMatchweek] = useState(true);
  const [loadingEntry, setLoadingEntry] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const [hasExistingEntry, setHasExistingEntry] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);

  function updatePick(matchId: number, next: ScorePick) {
    if (status !== "authenticated") {
      setShowSignInPrompt(true);
      return;
    }

    setPicks((prev) => ({
      ...prev,
      [matchId]: next,
    }));
  }

  useEffect(() => {
    async function loadMatchweek() {
      try {
        setLoadingMatchweek(true);
        setLoadingEntry(false);
        setSubmitError("");
        setSubmitSuccess("");
        setHasExistingEntry(false);

        const params = new URLSearchParams();
        if (selectedMatchweek) {
          params.set("matchweek", selectedMatchweek);
        }

        const query = params.toString();
        const res = await fetch(
          `/api/soccer/predictions/premier-league/matchweek${
            query ? `?${query}` : ""
          }`,
          { cache: "no-store" }
        );

        const data: MatchweekResponse & { error?: string } = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load matchweek");
        }

        const liveMatches = Array.isArray(data.matches) ? data.matches : [];
        const nextLabel = data.matchweekLabel || null;
        const normalizedOptions = normalizeMatchweekOptions(
          data.availableMatchweeks,
          nextLabel
        );

        setMatches(liveMatches);
        setLeagueName(data.leagueName || "Premier League");
        setMatchweekLabel(nextLabel);
        setAvailableMatchweeks(normalizedOptions);

        if (!selectedMatchweek && nextLabel) {
          setSelectedMatchweek(nextLabel);
        }

        const initialPicks: Record<number, ScorePick> = {};
        for (const match of liveMatches) {
          initialPicks[match.id] = { homeScore: "", awayScore: "" };
        }
        setPicks(initialPicks);
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : "Failed to load matchweek"
        );
        setMatches([]);
        setPicks({});
      } finally {
        setLoadingMatchweek(false);
      }
    }

    loadMatchweek();
  }, [selectedMatchweek]);

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
  homeScore: String(row.predicted_home_score ?? ""),
  awayScore: String(row.predicted_away_score ?? ""),
  actualHomeScore:
    row.actual_home_score === null || row.actual_home_score === undefined
      ? ""
      : String(row.actual_home_score),
  actualAwayScore:
    row.actual_away_score === null || row.actual_away_score === undefined
      ? ""
      : String(row.actual_away_score),
  graded: Boolean(row.graded),
  points: Number(row.points ?? 0),
  bttsPoints: Number(row.btts_points ?? 0),
  ouPoints: Number(row.ou_points ?? 0),
  onextwoPoints: Number(row.onextwo_points ?? 0),
  correctScorePoints: Number(row.correct_score_points ?? 0),
};
            }

            return nextPicks;
          });

          setHasExistingEntry(true);
          setSubmitSuccess("");
        } else {
          setHasExistingEntry(false);
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

  const editableMatchList = useMemo(() => {
    return matches.filter((match) => !hasMatchStarted(match.kickoff));
  }, [matches]);

  const editableMatches = editableMatchList.length;

  const completedEditableMatches = useMemo(() => {
    return editableMatchList.filter((match) => {
      const pick = picks[match.id];
      return pick?.homeScore !== "" && pick?.awayScore !== "";
    }).length;
  }, [editableMatchList, picks]);

  const allEditableCompleted =
    editableMatches > 0 && completedEditableMatches === editableMatches;

  const pageLoading = loadingMatchweek || loadingEntry;
  const allStarted = totalMatches > 0 && editableMatches === 0;

  async function handleSubmit() {
    if (status !== "authenticated") {
      setShowSignInPrompt(true);
      return;
    }

    try {
      setSubmitError("");
      setSubmitSuccess("");
      setSubmitting(true);

      if (!matchweekLabel) {
        setSubmitError("No active matchweek is available right now.");
        return;
      }

      if (allStarted) {
        setSubmitError("All matches in this matchweek have already started.");
        return;
      }

      if (!allEditableCompleted) {
        setSubmitError(
          "Please complete all picks for matches that have not started yet."
        );
        return;
      }

      const payload = editableMatchList.map((match) => ({
        match_id: String(match.id),
        home_team: match.home,
        away_team: match.away,
        kickoff: match.kickoff,
        predicted_home_score: Number(picks[match.id]?.homeScore ?? ""),
        predicted_away_score: Number(picks[match.id]?.awayScore ?? ""),
        btts_yes_odds: match.btts_yes_odds,
        btts_no_odds: match.btts_no_odds,
        over_2_5_odds: match.over_2_5_odds,
        under_2_5_odds: match.under_2_5_odds,
        home_win_odds: match.home_win_odds,
        draw_odds: match.draw_odds,
        away_win_odds: match.away_win_odds,
      }));

      if (payload.length === 0) {
        setSubmitError("There are no editable matches available right now.");
        return;
      }

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
        throw new Error(data?.error || "Failed to save predictions");
      }

      setHasExistingEntry(true);

      const updatedCount = Number(data?.updated ?? 0);
      const insertedCount = Number(data?.inserted ?? 0);
      const skippedCount = Number(data?.skipped ?? 0);

      setSubmitSuccess(
        hasExistingEntry
          ? `Predictions updated successfully. Updated ${updatedCount}, added ${insertedCount}, skipped ${skippedCount} locked match(es).`
          : `Predictions submitted successfully. Added ${insertedCount}, updated ${updatedCount}, skipped ${skippedCount} locked match(es).`
      );
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

        <div className="relative mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
              Soccer Zone • {leagueName}
            </div>

            <h1 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-5xl lg:text-6xl">
              Pick Zone
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
              Predict the exact score for each featured match and build your
              full matchweek card.
            </p>

            {!pageLoading && allStarted ? (
              <div className="mx-auto mt-4 max-w-2xl rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                All matches in this gameweek have started, so picks are locked.
              </div>
            ) : null}
          </div>

          <div className="mx-auto mt-5 max-w-6xl">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-center shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  League
                </div>
                <div className="mt-3 text-2xl font-bold text-white">
                  {leagueName}
                </div>
              </div>

              <div className="relative rounded-[24px] border border-white/10 bg-white/5 p-4 text-center shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                  Matchweek
                </div>

                <button
                  type="button"
                  onClick={() => setMatchweekMenuOpen((prev) => !prev)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-2xl font-bold text-white transition hover:border-emerald-300/30 hover:bg-black/35"
                >
                  <span>{matchweekLabel || "No active week"}</span>
                  <span className="text-sm text-white/50">
                    {matchweekMenuOpen ? "▲" : "▼"}
                  </span>
                </button>

                {matchweekMenuOpen ? (
                  <div className="absolute left-4 right-4 top-[96px] z-30 rounded-2xl border border-white/10 bg-[#0a1220] p-2 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                    <div className="max-h-64 overflow-y-auto">
                      {availableMatchweeks.length === 0 ? (
                        <button
                          type="button"
                          className="w-full rounded-xl px-4 py-3 text-center text-sm font-semibold text-white/70"
                        >
                          No matchweeks available
                        </button>
                      ) : (
                        availableMatchweeks.map((option) => {
                          const active =
                            option.value ===
                            (selectedMatchweek || matchweekLabel);

                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setSelectedMatchweek(option.value);
                                setMatchweekMenuOpen(false);
                              }}
                              className={`w-full rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${
                                active
                                  ? "bg-emerald-500/15 text-emerald-200"
                                  : "text-white/80 hover:bg-white/5 hover:text-white"
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-center shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">
                  Picks
                </div>
                <div className="mt-3 text-2xl font-bold text-white">
                  {totalCompleted}/{totalMatches} Complete
                </div>
                <div className="mt-1 text-sm text-white/55">
                  {editableMatches} editable matches left
                </div>
              </div>
            </div>

            {pageLoading ? (
              <div className="mx-auto mt-4 max-w-3xl rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-white/60">
                Loading current gameweek and saved predictions...
              </div>
            ) : !allStarted && hasExistingEntry ? (
              <div className="mx-auto mt-4 max-w-3xl rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-200">
                You can update any pick for matches that have not started yet.
              </div>
            ) : null}

            {status !== "authenticated" && !pageLoading && !allStarted ? (
              <div className="mx-auto mt-4 max-w-3xl rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-center text-sm text-cyan-200">
                Sign in to adjust games and submit your prediction card.
              </div>
            ) : null}
          </div>

          <div className="mt-8 grid gap-4 xl:grid-cols-[1fr_320px]">
            <div>
              <div className="mb-4">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  Featured Fixtures
                </div>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  Enter your scorelines
                </h2>
              </div>

              {matches.length === 0 && !pageLoading ? (
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-white/65">
                  No upcoming matches found for this matchweek.
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {matches.map((match) => (
                    <MatchCard
                    
                      key={match.id}
                      match={match}
                      pick={picks[match.id] || { homeScore: "", awayScore: "" }}
                      onChange={(next) => updatePick(match.id, next)}
                      locked={hasMatchStarted(match.kickoff)}
                      leagueName={leagueName}
                      authRequired={status !== "authenticated"}
                      onAuthRequired={() => setShowSignInPrompt(true)}
                    />
                  ))}
                </div>
              )}
            </div>

            <aside className="h-fit rounded-[22px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl xl:sticky xl:top-20">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
                Your Card
              </div>

              <h2 className="mt-2 text-xl font-bold text-white">
                Matchweek Summary
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/60">
                Review your saved scorelines before submitting.
              </p>

              <div className="mt-4 space-y-2.5">
                {matches.map((match) => {
                  const pick = picks[match.id] || {
                    homeScore: "",
                    awayScore: "",
                  };

                  const locked = hasMatchStarted(match.kickoff);
                  const complete =
                    pick.homeScore !== "" && pick.awayScore !== "";

                  const homeShort = getShortTeamName(match.home);
                  const awayShort = getShortTeamName(match.away);

                  const homeScoreNum = Number(pick.homeScore);
                  const awayScoreNum = Number(pick.awayScore);

                  const predictionSide = !complete
                    ? "none"
                    : homeScoreNum > awayScoreNum
                      ? "home"
                      : homeScoreNum < awayScoreNum
                        ? "away"
                        : "draw";

                  const summaryGlowClass =
                    predictionSide === "home"
                      ? "before:absolute before:top-0 before:bottom-0 before:left-0 before:w-[36%] before:bg-[radial-gradient(circle_at_left_center,rgba(16,185,129,0.14),transparent_72%)]"
                      : predictionSide === "away"
                        ? "before:absolute before:top-0 before:bottom-0 before:right-0 before:w-[36%] before:bg-[radial-gradient(circle_at_right_center,rgba(139,92,246,0.14),transparent_72%)]"
                        : predictionSide === "draw"
                          ? "before:absolute before:inset-y-0 before:left-0 before:w-1/2 before:bg-[radial-gradient(circle_at_85%_50%,rgba(34,211,238,0.10),transparent_72%)] after:absolute after:inset-y-0 after:right-0 after:w-1/2 after:bg-[radial-gradient(circle_at_15%_50%,rgba(34,211,238,0.10),transparent_72%)]"
                          : "";

                  const homeAccentClass =
                    predictionSide === "home"
                      ? "ring-2 ring-emerald-400/35 bg-emerald-500/10"
                      : predictionSide === "draw"
                        ? "ring-2 ring-cyan-400/25 bg-cyan-500/10"
                        : "";

                  const awayAccentClass =
                    predictionSide === "away"
                      ? "ring-2 ring-violet-400/35 bg-violet-500/10"
                      : predictionSide === "draw"
                        ? "ring-2 ring-cyan-400/25 bg-cyan-500/10"
                        : "";

                  return (
                    <div
                      key={match.id}
                      className={`relative overflow-hidden rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] px-3 py-2.5 shadow-[0_8px_22px_rgba(0,0,0,0.20)] ${summaryGlowClass}`}
                    >
                      <div className="relative z-10">
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
                          <div className="flex min-w-0 flex-col items-center text-center">
                            <div className={`rounded-[16px] p-1 ${homeAccentClass}`}>
                              <div className="flex h-9 w-9 items-center justify-center">
                                <img
                                  src={match.homeLogo}
                                  alt={match.home}
                                  className="h-7 w-7 object-contain"
                                />
                              </div>
                            </div>
                            <div className="mt-1.5 max-w-[92px] text-[12px] font-semibold leading-tight text-white whitespace-normal break-normal">
                              {homeShort}
                            </div>
                          </div>

                          <div className="min-w-[60px] text-center">
                            <div className="text-[1.9rem] font-black leading-none tracking-tight text-white">
                              {complete
                                ? `${pick.homeScore} - ${pick.awayScore}`
                                : "- -"}
                            </div>

                            {locked ? (
                              <div className="mt-1 inline-flex rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-200">
                                Locked
                              </div>
                            ) : null}
                          </div>

                          <div className="flex min-w-0 flex-col items-center text-center">
                            <div className={`rounded-[16px] p-1 ${awayAccentClass}`}>
                              <div className="flex h-9 w-9 items-center justify-center">
                                <img
                                  src={match.awayLogo}
                                  alt={match.away}
                                  className="h-7 w-7 object-contain"
                                />
                              </div>
                            </div>
                            <div className="mt-1.5 max-w-[92px] text-[12px] font-semibold leading-tight text-white whitespace-normal break-normal">
                              {awayShort}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {submitError ? (
                <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {submitError}
                </div>
              ) : null}

              {submitSuccess ? (
                <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {submitSuccess}
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  status === "authenticated" &&
                  (!allEditableCompleted ||
                    submitting ||
                    pageLoading ||
                    matches.length === 0 ||
                    allStarted)
                }
                className={[
                  "mt-4 w-full rounded-2xl px-5 py-4 text-sm font-semibold transition",
                  status !== "authenticated"
                    ? "bg-white text-black hover:scale-[1.01]"
                    : allEditableCompleted &&
                        !submitting &&
                        !pageLoading &&
                        matches.length > 0 &&
                        !allStarted
                      ? "bg-white text-black hover:scale-[1.01]"
                      : "cursor-not-allowed border border-white/10 bg-white/5 text-white/40",
                ].join(" ")}
              >
                {pageLoading
                  ? "Loading..."
                  : submitting
                    ? hasExistingEntry
                      ? "Updating..."
                      : "Submitting..."
                    : allStarted
                      ? "All Matches Locked"
                      : status !== "authenticated"
                        ? "Sign In to Submit"
                        : hasExistingEntry
                          ? "Update Editable Picks"
                          : "Submit Picks"}
              </button>
            </aside>
          </div>
        </div>
      </section>

      {showSignInPrompt ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          onClick={() => setShowSignInPrompt(false)}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-[#31294c] bg-[linear-gradient(180deg,#151127,#0d0a19)] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
            <div className="absolute -top-16 right-[-30px] h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="absolute -bottom-16 left-[-20px] h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative">
              <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200">
                Fore Zone
              </div>

              <h3 className="mt-4 text-2xl font-black tracking-tight text-white">
                Sign in to submit predictions
              </h3>

              <p className="mt-3 text-sm leading-6 text-[#c7c3da]">
                You need to be signed in if you want to adjust a game and submit
                a prediction.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500/20"
                >
                  Sign In
                </button>

                <button
                  type="button"
                  onClick={() => setShowSignInPrompt(false)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-[#d8d4ea] transition hover:bg-white/10"
                >
                  Nah, I&apos;m browsing
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        @keyframes pulseGlowLeft {
          0%,
          100% {
            opacity: 0.55;
            transform: scale(1);
          }
          50% {
            opacity: 0.95;
            transform: scale(1.04);
          }
        }

        @keyframes pulseGlowRight {
          0%,
          100% {
            opacity: 0.55;
            transform: scale(1);
          }
          50% {
            opacity: 0.95;
            transform: scale(1.04);
          }
        }

        @keyframes pulseBadge {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.95;
          }
          50% {
            transform: scale(1.03);
            opacity: 1;
          }
        }

        @keyframes pulseDrawBadge {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.92;
          }
          50% {
            transform: scale(1.035);
            opacity: 1;
          }
        }

        @keyframes pulseDrawCenter {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.9;
          }
          50% {
            transform: scale(1.06);
            opacity: 1;
          }
        }

        @keyframes pulseDrawSide {
          0%,
          100% {
            opacity: 0.72;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.03);
          }
        }
      `}</style>
    </main>
  );
}