import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type GradeMatch = {
  match_id: string;
  actual_home_score: number;
  actual_away_score: number;
};

function getResult(home: number, away: number): "1" | "X" | "2" {
  if (home > away) return "1";
  if (home < away) return "2";
  return "X";
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function calculatePickPoints(pick: {
  predicted_home_score: number;
  predicted_away_score: number;
  actual_home_score: number;
  actual_away_score: number;
  btts_yes_odds: number | null;
  btts_no_odds: number | null;
  over_2_5_odds: number | null;
  under_2_5_odds: number | null;
  home_win_odds: number | null;
  draw_odds: number | null;
  away_win_odds: number | null;
}) {
  const predictedHome = Number(pick.predicted_home_score);
  const predictedAway = Number(pick.predicted_away_score);
  const actualHome = Number(pick.actual_home_score);
  const actualAway = Number(pick.actual_away_score);

  let bttsPoints = 0;
  let ouPoints = 0;
  let oneXTwoPoints = 0;
  let correctScorePoints = 0;

  const predictedBTTS = predictedHome > 0 && predictedAway > 0 ? "Yes" : "No";
  const actualBTTS = actualHome > 0 && actualAway > 0 ? "Yes" : "No";

  if (predictedBTTS === actualBTTS) {
    bttsPoints =
      actualBTTS === "Yes"
        ? 0.5 * Number(pick.btts_yes_odds || 0)
        : 0.5 * Number(pick.btts_no_odds || 0);
  }

  const predictedOU = predictedHome + predictedAway > 2.5 ? "Over" : "Under";
  const actualOU = actualHome + actualAway > 2.5 ? "Over" : "Under";

  if (predictedOU === actualOU) {
    ouPoints =
      actualOU === "Over"
        ? 0.5 * Number(pick.over_2_5_odds || 0)
        : 0.5 * Number(pick.under_2_5_odds || 0);
  }

  const predicted1X2 = getResult(predictedHome, predictedAway);
  const actual1X2 = getResult(actualHome, actualAway);

  if (predicted1X2 === actual1X2) {
    if (actual1X2 === "1") {
      oneXTwoPoints = 0.2 * Number(pick.home_win_odds || 0);
    } else if (actual1X2 === "X") {
      oneXTwoPoints = 0.5 * Number(pick.draw_odds || 0);
    } else {
      oneXTwoPoints = 0.3 * Number(pick.away_win_odds || 0);
    }
  }

  if (predictedHome === actualHome) correctScorePoints += 17.5;
  if (predictedAway === actualAway) correctScorePoints += 17.5;

  if (
    predictedHome === actualHome &&
    predictedAway === actualAway &&
    actualHome === actualAway
  ) {
    correctScorePoints += 50;
  }

  bttsPoints = round2(bttsPoints);
  ouPoints = round2(ouPoints);
  oneXTwoPoints = round2(oneXTwoPoints);
  correctScorePoints = round2(correctScorePoints);

  const totalPoints = round2(
    bttsPoints + ouPoints + oneXTwoPoints + correctScorePoints
  );

  return {
    bttsPoints,
    ouPoints,
    oneXTwoPoints,
    correctScorePoints,
    totalPoints,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leagueSlug, matchweekLabel, results } = body ?? {};

    if (
      !leagueSlug ||
      !matchweekLabel ||
      !Array.isArray(results) ||
      results.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required grading payload" },
        { status: 400 }
      );
    }

    const { data: entries, error: entriesError } = await supabase
      .from("soccer_prediction_entries")
      .select("id")
      .eq("league_slug", String(leagueSlug))
      .eq("matchweek_label", String(matchweekLabel));

    if (entriesError) {
      return NextResponse.json(
        { error: entriesError.message },
        { status: 500 }
      );
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { error: "No entries found for this matchweek" },
        { status: 404 }
      );
    }

    const entryIds = entries.map((e) => e.id);

    const { data: picks, error: picksError } = await supabase
      .from("soccer_prediction_picks")
      .select(`
        id,
        entry_id,
        match_id,
        predicted_home_score,
        predicted_away_score,
        btts_yes_odds,
        btts_no_odds,
        over_2_5_odds,
        under_2_5_odds,
        home_win_odds,
        draw_odds,
        away_win_odds
      `)
      .in("entry_id", entryIds);

    if (picksError) {
      return NextResponse.json(
        { error: picksError.message },
        { status: 500 }
      );
    }

    const resultMap = new Map<string, GradeMatch>();
    for (const item of results as GradeMatch[]) {
      resultMap.set(String(item.match_id), {
        match_id: String(item.match_id),
        actual_home_score: Number(item.actual_home_score),
        actual_away_score: Number(item.actual_away_score),
      });
    }

    const updates = [];
    for (const pick of picks || []) {
      const result = resultMap.get(String(pick.match_id));
      if (!result) continue;

      const scored = calculatePickPoints({
        predicted_home_score: Number(pick.predicted_home_score),
        predicted_away_score: Number(pick.predicted_away_score),
        actual_home_score: result.actual_home_score,
        actual_away_score: result.actual_away_score,
        btts_yes_odds: Number(pick.btts_yes_odds || 0),
        btts_no_odds: Number(pick.btts_no_odds || 0),
        over_2_5_odds: Number(pick.over_2_5_odds || 0),
        under_2_5_odds: Number(pick.under_2_5_odds || 0),
        home_win_odds: Number(pick.home_win_odds || 0),
        draw_odds: Number(pick.draw_odds || 0),
        away_win_odds: Number(pick.away_win_odds || 0),
      });

      updates.push(
        supabase
          .from("soccer_prediction_picks")
          .update({
            actual_home_score: result.actual_home_score,
            actual_away_score: result.actual_away_score,
            btts_points: scored.bttsPoints,
            ou_points: scored.ouPoints,
            onextwo_points: scored.oneXTwoPoints,
            correct_score_points: scored.correctScorePoints,
            points: scored.totalPoints,
            graded: true,
            graded_at: new Date().toISOString(),
          })
          .eq("id", pick.id)
      );
    }

    await Promise.all(updates);

    const { data: refreshedPicks, error: refreshedError } = await supabase
      .from("soccer_prediction_picks")
      .select("entry_id, points")
      .in("entry_id", entryIds);

    if (refreshedError) {
      return NextResponse.json(
        { error: refreshedError.message },
        { status: 500 }
      );
    }

    const totalsByEntry: Record<string, number> = {};
    for (const pick of refreshedPicks || []) {
      const key = String(pick.entry_id);
      totalsByEntry[key] = round2(
        (totalsByEntry[key] || 0) + Number(pick.points || 0)
      );
    }

    const entryUpdates = Object.entries(totalsByEntry).map(([entryId, total]) =>
      supabase
        .from("soccer_prediction_entries")
        .update({
          total_points: total,
          graded: true,
        })
        .eq("id", entryId)
    );

    await Promise.all(entryUpdates);

    return NextResponse.json({
      success: true,
      gradedEntries: Object.keys(totalsByEntry).length,
      updatedPicks: updates.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
}