import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const leagueSlug = searchParams.get("leagueSlug");
    const matchweekLabel = searchParams.get("matchweekLabel");

    if (!leagueSlug || !matchweekLabel) {
      return NextResponse.json(
        { error: "Missing required query params" },
        { status: 400 }
      );
    }

    const { data: entry, error: entryError } = await supabase
      .from("soccer_prediction_entries")
      .select("id, user_id, league_slug, matchweek_label, status, submitted_at")
      .eq("user_id", appUserId)
      .eq("league_slug", leagueSlug)
      .eq("matchweek_label", matchweekLabel)
      .maybeSingle();

    if (entryError) {
      return NextResponse.json(
        { error: entryError.message || "Failed to load entry" },
        { status: 500 }
      );
    }

    if (!entry) {
      return NextResponse.json({ entry: null, picks: [] });
    }

    const { data: picks, error: picksError } = await supabase
      .from("soccer_prediction_picks")
      .select(
        "match_id, home_team, away_team, predicted_home_score, predicted_away_score"
      )
      .eq("entry_id", entry.id)
      .order("match_id", { ascending: true });

    if (picksError) {
      return NextResponse.json(
        { error: picksError.message || "Failed to load picks" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      entry,
      picks: picks || [],
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