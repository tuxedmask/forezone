"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { getNBALogo } from "@/lib/nbaTeams";

export type PickRow = {
  id: string;
  user_id: string;
  user_name: string | null;
  user_image: string | null;
  game_id: string | null;
  away_team: string | null;
  home_team: string | null;
  commence_time: string | null;
  pick_type: string | null;
  prop: string | null;
  american_odds: number | string | null;
  decimal_odds: number | string | null;
  bookie: string | null;
  result: string | null;
  created_at: string;
  sport?: string | null;
};

function getResultBadge(result: string | null) {
  switch (result) {
    case "win":
      return "bg-green-600/20 text-green-400 border border-green-500/30";
    case "loss":
      return "bg-red-500/15 text-red-300 border border-red-400/30";
    case "push":
      return "bg-amber-500/15 text-amber-300 border border-amber-400/30";
    default:
      return "bg-zinc-700/30 text-zinc-300 border border-zinc-600";
  }
}

function getRowStyle(result: string | null) {
  switch (result) {
    case "win":
      return "bg-green-500/10 shadow-[0_0_18px_rgba(34,197,94,0.14)]";
    case "loss":
      return "bg-red-500/10 shadow-[0_0_18px_rgba(239,68,68,0.14)]";
    case "push":
      return "bg-amber-500/10 shadow-[0_0_16px_rgba(245,158,11,0.12)]";
    default:
      return "bg-transparent";
  }
}

function formatDateTime(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function formatPickType(pickType: string | null) {
  switch (pickType) {
    case "moneyline":
      return "Moneyline";
    case "spread":
      return "Spread";
    case "total":
      return "Total";
    case "player_prop":
      return "Player Prop";
    default:
      return "Pick";
  }
}

function getPickTypeBadge(pickType: string | null) {
  switch (pickType) {
    case "moneyline":
      return "bg-indigo-500/15 text-indigo-200 border border-indigo-400/30";
    case "spread":
      return "bg-purple-500/15 text-purple-300 border border-purple-400/30";
    case "total":
      return "bg-amber-500/15 text-amber-300 border border-amber-400/30";
    case "player_prop":
      return "bg-violet-500/15 text-violet-200 border border-violet-400/30";
    default:
      return "bg-zinc-700/30 text-zinc-300 border border-zinc-600";
  }
}

function TeamLogo({
  team,
  sport,
}: {
  team: string | null;
  sport: string;
}) {
  if (!team) {
    return (
      <div className="h-7 w-7 rounded-full border border-[#31294c] bg-[#1a1630]" />
    );
  }

  if (sport !== "nba") {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#31294c] bg-[#1a1630] text-[10px] font-bold text-[#cfc8ee]">
        {team.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  const src = getNBALogo(team);

  if (!src) {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#31294c] bg-[#1a1630] text-[10px] font-bold text-[#cfc8ee]">
        {team.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={team}
      width={28}
      height={28}
      unoptimized
      className="rounded-full object-contain"
    />
  );
}

export default function PickHistoryTabs({ picks }: { picks: PickRow[] }) {
  const [activeTab, setActiveTab] = useState<"nba" | "soccer">("nba");

  const nbaPicks = useMemo(
    () => picks.filter((pick) => !pick.sport || pick.sport === "nba"),
    [picks]
  );

  const soccerPicks = useMemo(
    () => picks.filter((pick) => pick.sport === "soccer"),
    [picks]
  );

  const visiblePicks = activeTab === "nba" ? nbaPicks : soccerPicks;

  return (
    <div className="rounded-2xl border border-[#31294c] bg-[linear-gradient(180deg,#131021,#0b0914)] p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-xl font-semibold">Pick History</h3>

        <div className="inline-flex w-fit rounded-xl border border-[#31294c] bg-[#0f0c19] p-1">
          <button
            onClick={() => setActiveTab("nba")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === "nba"
                ? "bg-indigo-500/20 text-white shadow-[0_0_20px_rgba(99,102,241,0.18)]"
                : "text-[#9f96c7] hover:text-white"
            }`}
          >
            NBA ({nbaPicks.length})
          </button>

          <button
            onClick={() => setActiveTab("soccer")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === "soccer"
                ? "bg-indigo-500/20 text-white shadow-[0_0_20px_rgba(99,102,241,0.18)]"
                : "text-[#9f96c7] hover:text-white"
            }`}
          >
            Soccer ({soccerPicks.length})
          </button>
        </div>
      </div>

      {visiblePicks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#31294c] p-8 text-center text-[#9f96c7]">
          No {activeTab.toUpperCase()} picks yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-[#9f96c7]">
                <th className="py-3 pr-4">Game Time</th>
                <th className="py-3 pr-4">Matchup</th>
                <th className="py-3 pr-4">Type</th>
                <th className="py-3 pr-4">Prop</th>
                <th className="py-3 pr-4">Odds</th>
                <th className="py-3 pr-4">Book</th>
                <th className="py-3 pr-4 text-right">Result</th>
              </tr>
            </thead>
            <tbody>
              {visiblePicks.map((pick) => {
                const sport = pick.sport || "nba";

                return (
                  <tr
                    key={pick.id}
                    className={`rounded-xl border border-[#31294c] ${getRowStyle(
                      pick.result
                    )}`}
                  >
                    <td className="rounded-l-xl px-4 py-4 text-[#d6d3e6]">
                      {formatDateTime(pick.commence_time)}
                    </td>

                    <td className="px-4 py-4">
                      {pick.away_team && pick.home_team ? (
                        <div className="flex min-w-[240px] items-center gap-3">
                          <div className="flex items-center gap-2">
                            <TeamLogo team={pick.away_team} sport={sport} />
                            <span className="font-medium text-white">
                              {pick.away_team}
                            </span>
                          </div>

                          <span className="text-[#8e86aa]">@</span>

                          <div className="flex items-center gap-2">
                            <TeamLogo team={pick.home_team} sport={sport} />
                            <span className="font-medium text-white">
                              {pick.home_team}
                            </span>
                          </div>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPickTypeBadge(
                          pick.pick_type
                        )}`}
                      >
                        {formatPickType(pick.pick_type)}
                      </span>
                    </td>

                    <td className="px-4 py-4 font-medium">
                      {pick.prop || "-"}
                    </td>

                    <td className="px-4 py-4 text-[#d6d3e6]">
                      {pick.american_odds ?? "-"} / {pick.decimal_odds ?? "-"}
                    </td>

                    <td className="px-4 py-4 text-[#d6d3e6]">
                      {pick.bookie || "-"}
                    </td>

                    <td className="rounded-r-xl px-4 py-4 text-right">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${getResultBadge(
                          pick.result
                        )}`}
                      >
                        {pick.result || "pending"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}