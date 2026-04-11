import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type EntryRow = {
  id: string;
  user_id: string;
  league_slug: string;
  matchweek_label: string | null;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const userId = searchParams.get("userId");
    const matchweek = searchParams.get("matchweek");
    const leagueSlug = searchParams.get("leagueSlug");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId", picks: [] },
        { status: 400 }
      );
    }

    if (!leagueSlug) {
      return NextResponse.json(
        { error: "Missing leagueSlug", picks: [] },
        { status: 400 }
      );
    }

    let entriesQuery = supabase
      .from("soccer_prediction_entries")
      .select("id, user_id, league_slug, matchweek_label")
      .eq("league_slug", leagueSlug);

    if (matchweek) {
      entriesQuery = entriesQuery.eq("matchweek_label", `Week ${matchweek}`);
    }

    const { data: entriesData, error: entriesError } = await entriesQuery;

    if (entriesError) {
      console.error("leaderboard-user-picks entries error:", entriesError);
      return NextResponse.json(
        {
          error: "Failed to load soccer_prediction_entries",
          details: entriesError.message,
          picks: [],
        },
        { status: 500 }
      );
    }

    const entries = (entriesData || []) as EntryRow[];

    const userEntryIds = entries
      .filter((entry) => entry.user_id === userId)
      .map((entry) => entry.id);

    if (!userEntryIds.length) {
      return NextResponse.json({
        picks: [],
        debug: {
          reason: "no_user_entries_for_week",
          userId,
          matchweek,
          leagueSlug,
          totalEntriesForWeek: entries.length,
        },
      });
    }

    const { data: picksData, error: picksError } = await supabase
  .from("soccer_prediction_picks")
  .select("*")
  .in("entry_id", userEntryIds);

    if (picksError) {
      console.error("leaderboard-user-picks picks error:", picksError);
      return NextResponse.json(
        {
          error: "Failed to load soccer_prediction_picks",
          details: picksError.message,
          picks: [],
        },
        { status: 500 }
      );
    }

   const picks = picksData || [];

const gradedLikePicks = picks.filter((pick: any) => {
  const hasActualResult =
    pick.actual_home_score !== null &&
    pick.actual_home_score !== undefined &&
    pick.actual_away_score !== null &&
    pick.actual_away_score !== undefined;

  return hasActualResult;
});

const matchIds = [
  ...new Set(
    gradedLikePicks
      .map((pick: any) => pick.match_id)
      .filter(Boolean)
  ),
];

let fixtureMap: Record<string, { kickoff_time?: string | null }> = {};

if (matchIds.length > 0) {
  const { data: fixturesData, error: fixturesError } = await supabase
    .from("soccer_fixtures")
    .select("*")
    .in("match_id", matchIds);

  if (fixturesError) {
    console.error("leaderboard-user-picks fixtures error:", fixturesError);
  } else {
    fixtureMap = Object.fromEntries(
      (fixturesData || []).map((fixture: any) => [
        String(fixture.match_id),
        {
          kickoff_time:
            fixture.kickoff_time ??
            fixture.kickoff ??
            fixture.commence_time ??
            fixture.starts_at ??
            null,
        },
      ])
    );
  }
}

const picksWithKickoff = gradedLikePicks.map((pick: any) => ({
  ...pick,
  kickoff_time:
    pick.kickoff_time ??
    fixtureMap[String(pick.match_id)]?.kickoff_time ??
    null,
}));

    return NextResponse.json({
  picks: picksWithKickoff,
  debug: {
    reason: "ok",
    userId,
    matchweek,
    leagueSlug,
    totalEntriesForWeek: entries.length,
    userEntryIds,
    totalPicksFound: picks.length,
    gradedLikePicks: gradedLikePicks.length,
  },
});
  } catch (error) {
    console.error("leaderboard-user-picks unexpected error:", error);

    return NextResponse.json(
      {
        error: "Unexpected server error",
        details: error instanceof Error ? error.message : String(error),
        picks: [],
      },
      { status: 500 }
    );
  }
}