import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appUserId =
      (session.user as any)?.appUserId ||
      (session.user as any)?.id ||
      null;

    if (!appUserId) {
      return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    }

    const body = await req.json();
    const { leagueSlug, matchweekLabel, picks } = body ?? {};

    if (
      !leagueSlug ||
      !matchweekLabel ||
      !Array.isArray(picks) ||
      picks.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    for (const pick of picks) {
      if (
        !pick?.match_id ||
        !pick?.home_team ||
        !pick?.away_team ||
        pick?.predicted_home_score === undefined ||
        pick?.predicted_away_score === undefined
      ) {
        return NextResponse.json(
          { error: "Invalid pick payload" },
          { status: 400 }
        );
      }
    }

    const { data: entry, error: entryError } = await supabase
      .from("soccer_prediction_entries")
      .insert({
        user_id: appUserId,
        league_slug: String(leagueSlug),
        matchweek_label: String(matchweekLabel),
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (entryError || !entry) {
      const message =
        entryError?.message?.includes("soccer_prediction_entries_user_league_week_idx")
          ? "You already submitted predictions for this matchweek."
          : entryError?.message || "Failed to create prediction entry";

      return NextResponse.json({ error: message }, { status: 400 });
    }

    const rows = picks.map((pick: any) => ({
      entry_id: entry.id,
      match_id: String(pick.match_id),
      home_team: String(pick.home_team),
      away_team: String(pick.away_team),
      predicted_home_score: Number(pick.predicted_home_score),
      predicted_away_score: Number(pick.predicted_away_score),
    }));

    const { error: picksError } = await supabase
      .from("soccer_prediction_picks")
      .insert(rows);

    if (picksError) {
      return NextResponse.json(
        { error: picksError.message || "Failed to save picks" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      entryId: entry.id,
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