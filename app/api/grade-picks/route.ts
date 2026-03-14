import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const ODDS_API_KEY = process.env.ODDS_API_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

type ScoreGame = {
  id: string;
  completed?: boolean;
  home_team: string;
  away_team: string;
  scores?: Array<{
    name: string;
    score: string | number;
  }>;
};

function normalizeText(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function extractWinnerFromScores(game: ScoreGame) {
  if (!game.completed || !game.scores || game.scores.length < 2) return null;

  const homeScoreRow = game.scores.find((s) => s.name === game.home_team);
  const awayScoreRow = game.scores.find((s) => s.name === game.away_team);

  if (!homeScoreRow || !awayScoreRow) return null;

  const homeScore = Number(homeScoreRow.score);
  const awayScore = Number(awayScoreRow.score);

  if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) return null;
  if (homeScore === awayScore) return "push";

  return homeScore > awayScore ? game.home_team : game.away_team;
}

function gradeMoneylineLikePick(
  prop: string | null,
  homeTeam: string | null,
  awayTeam: string | null,
  winner: string | "push" | null
): "win" | "loss" | "push" | null {
  if (!prop || !homeTeam || !awayTeam || !winner) return null;
  if (winner === "push") return "push";

  const propText = normalizeText(prop);
  const home = normalizeText(homeTeam);
  const away = normalizeText(awayTeam);

  const looksLikeHomePick =
    propText === home ||
    propText === `${home} ml` ||
    propText === `${home} moneyline`;

  const looksLikeAwayPick =
    propText === away ||
    propText === `${away} ml` ||
    propText === `${away} moneyline`;

  if (!looksLikeHomePick && !looksLikeAwayPick) {
    return null;
  }

  const winnerText = normalizeText(winner);

  if (looksLikeHomePick) {
    return winnerText === home ? "win" : "loss";
  }

  if (looksLikeAwayPick) {
    return winnerText === away ? "win" : "loss";
  }

  return null;
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const url = new URL(req.url);
    const secretFromQuery = url.searchParams.get("secret");

    const isAuthorized =
      (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) ||
      (CRON_SECRET && secretFromQuery === CRON_SECRET);

    if (CRON_SECRET && !isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ODDS_API_KEY) {
      return NextResponse.json(
        { error: "Missing ODDS_API_KEY" },
        { status: 500 }
      );
    }

    const scoresUrl = new URL(
      "https://api.the-odds-api.com/v4/sports/basketball_nba/scores"
    );
    scoresUrl.searchParams.set("apiKey", ODDS_API_KEY);
    scoresUrl.searchParams.set("daysFrom", "3");

    const scoresRes = await fetch(scoresUrl.toString(), {
      cache: "no-store",
    });

    const scoresText = await scoresRes.text();

    if (!scoresRes.ok) {
      return NextResponse.json(
        {
          error: "Failed to fetch NBA scores",
          details: scoresText,
        },
        { status: scoresRes.status }
      );
    }

    const scoreGames: ScoreGame[] = scoresText ? JSON.parse(scoresText) : [];
    const completedGames = scoreGames.filter((game) => game.completed);

    const completedGameMap = new Map<string, ScoreGame>();
    for (const game of completedGames) {
      completedGameMap.set(game.id, game);
    }

    const { data: pendingPicks, error: picksError } = await supabase
      .from("picks")
      .select("*")
      .eq("result", "pending");

    if (picksError) {
      return NextResponse.json({ error: picksError.message }, { status: 500 });
    }

    const updated: Array<{ id: string; result: string }> = [];
    const skipped: Array<{ id: string; reason: string }> = [];

    for (const pick of pendingPicks ?? []) {
      const game = completedGameMap.get(pick.game_id);

      if (!game) {
        skipped.push({ id: pick.id, reason: "Game not completed yet" });
        continue;
      }

      const winner = extractWinnerFromScores(game);

      const gradedResult = gradeMoneylineLikePick(
        pick.prop,
        pick.home_team,
        pick.away_team,
        winner
      );

      if (!gradedResult) {
        skipped.push({ id: pick.id, reason: "Pick type not auto-gradeable" });
        continue;
      }

      const { error: updateError } = await supabase
        .from("picks")
        .update({
          result: gradedResult,
          settled_at: new Date().toISOString(),
        })
        .eq("id", pick.id);

      if (updateError) {
        skipped.push({ id: pick.id, reason: updateError.message });
        continue;
      }

      updated.push({ id: pick.id, result: gradedResult });
    }

    return NextResponse.json({
  success: true,
  completedGamesFound: completedGames.length,
  pendingPicksFound: pendingPicks?.length ?? 0,
  updatedCount: updated.length,
  skippedCount: skipped.length,
  updated,
  skipped,
});
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to auto-grade picks" },
      { status: 500 }
    );
  }
}