import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leagueSlug, matchweekLabel } = body ?? {};

    if (!leagueSlug || !matchweekLabel) {
      return NextResponse.json(
        { error: "Missing leagueSlug or matchweekLabel" },
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

    const entryIds = (entries || []).map((entry) => entry.id);

    const { error: resultsError } = await supabase
      .from("soccer_match_results")
      .delete()
      .eq("league_slug", String(leagueSlug))
      .eq("matchweek_label", String(matchweekLabel));

    if (resultsError) {
      return NextResponse.json(
        { error: resultsError.message },
        { status: 500 }
      );
    }

    if (entryIds.length > 0) {
      const { error: picksError } = await supabase
        .from("soccer_prediction_picks")
        .update({
          actual_home_score: null,
          actual_away_score: null,
          btts_points: 0,
          ou_points: 0,
          onextwo_points: 0,
          correct_score_points: 0,
          points: 0,
          graded: false,
          graded_at: null,
        })
        .in("entry_id", entryIds);

      if (picksError) {
        return NextResponse.json(
          { error: picksError.message },
          { status: 500 }
        );
      }

      const { error: entriesResetError } = await supabase
        .from("soccer_prediction_entries")
        .update({
          total_points: 0,
          graded: false,
        })
        .in("id", entryIds);

      if (entriesResetError) {
        return NextResponse.json(
          { error: entriesResetError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      resetEntries: entryIds.length,
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