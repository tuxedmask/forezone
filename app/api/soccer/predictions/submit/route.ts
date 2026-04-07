import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type IncomingPick = {
  match_id: string;
  home_team: string;
  away_team: string;
  predicted_home_score: number;
  predicted_away_score: number;
  kickoff?: string | null;

  btts_yes_odds?: number | null;
  btts_no_odds?: number | null;
  over_2_5_odds?: number | null;
  under_2_5_odds?: number | null;
  home_win_odds?: number | null;
  draw_odds?: number | null;
  away_win_odds?: number | null;
};

function hasMatchStarted(kickoff?: string | null) {
  if (!kickoff) return false;
  const ts = new Date(kickoff).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() >= ts;
}

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

    if (!leagueSlug || !matchweekLabel || !Array.isArray(picks)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 🔥 DO NOT BLOCK ENTIRE REQUEST ANYMORE

    // 1) Get or create entry
    const { data: existingEntry } = await supabase
      .from("soccer_prediction_entries")
      .select("id, graded")
      .eq("user_id", appUserId)
      .eq("league_slug", leagueSlug)
      .eq("matchweek_label", matchweekLabel)
      .maybeSingle();

    if (existingEntry?.graded) {
      return NextResponse.json(
        { error: "This matchweek has already been graded." },
        { status: 400 }
      );
    }

    let entryId = existingEntry?.id;

    if (!entryId) {
      const { data } = await supabase
        .from("soccer_prediction_entries")
        .insert({
          user_id: appUserId,
          league_slug: leagueSlug,
          matchweek_label: matchweekLabel,
          status: "submitted",
          submitted_at: new Date().toISOString(),
          graded: false,
        })
        .select("id")
        .single();

      entryId = data?.id;
    }

    // 2) load existing picks
    const { data: existingPicks } = await supabase
      .from("soccer_prediction_picks")
      .select("id, match_id, graded")
      .eq("entry_id", entryId);

    const map = new Map<string, any>();
    existingPicks?.forEach((p) => map.set(String(p.match_id), p));

    let updated = 0;
    let inserted = 0;
    let skipped = 0;

    for (const pick of picks as IncomingPick[]) {
      const started = hasMatchStarted(pick.kickoff);

      const existing = map.get(String(pick.match_id));

      const base = {
        entry_id: entryId,
        match_id: pick.match_id,
        home_team: pick.home_team,
        away_team: pick.away_team,
        predicted_home_score: pick.predicted_home_score,
        predicted_away_score: pick.predicted_away_score,

        btts_yes_odds: pick.btts_yes_odds ?? 0,
        btts_no_odds: pick.btts_no_odds ?? 0,
        over_2_5_odds: pick.over_2_5_odds ?? 0,
        under_2_5_odds: pick.under_2_5_odds ?? 0,
        home_win_odds: pick.home_win_odds ?? 0,
        draw_odds: pick.draw_odds ?? 0,
        away_win_odds: pick.away_win_odds ?? 0,
      };

      // 🔒 IF MATCH STARTED → SKIP
      if (started) {
        skipped++;
        continue;
      }

      // ❌ if already graded → skip
      if (existing?.graded) {
        skipped++;
        continue;
      }

      // insert
      if (!existing) {
        await supabase.from("soccer_prediction_picks").insert({
          ...base,
          points: 0,
          graded: false,
        });
        inserted++;
      } else {
        await supabase
          .from("soccer_prediction_picks")
          .update(base)
          .eq("id", existing.id);

        updated++;
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      inserted,
      skipped,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}