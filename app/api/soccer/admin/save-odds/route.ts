import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type IncomingOddsRow = {
  match_id: string;
  home_team: string;
  away_team: string;
  kickoff: string;

  home_win_odds: string;
  draw_odds: string;
  away_win_odds: string;

  over_2_5_odds: string;
  under_2_5_odds: string;

  btts_yes_odds: string;
  btts_no_odds: string;

  odds_locked?: boolean;
};

function toNumberOrNull(value: unknown) {
  const str = String(value ?? "").trim();
  if (!str) return null;

  const num = Number(str);
  return Number.isFinite(num) ? num : null;
}

function shouldLockOdds(kickoff: string) {
  const ts = new Date(kickoff).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() >= ts - 5 * 60 * 1000;
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("soccer_match_odds")
      .select("*")
      .eq("league_slug", "premier-league")
      .order("kickoff", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to load odds" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      rows: data || [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rows = Array.isArray(body?.rows) ? body.rows : [];

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No odds rows provided" },
        { status: 400 }
      );
    }

    for (const row of rows as IncomingOddsRow[]) {
      if (!row.match_id || !row.home_team || !row.away_team || !row.kickoff) {
        return NextResponse.json(
          { error: "Missing required match data" },
          { status: 400 }
        );
      }

      const lockNow = Boolean(row.odds_locked) || shouldLockOdds(row.kickoff);

      const payload = {
        match_id: String(row.match_id),
        league_slug: "premier-league",
        home_team: String(row.home_team),
        away_team: String(row.away_team),
        kickoff: row.kickoff,

        home_win_odds: toNumberOrNull(row.home_win_odds),
        draw_odds: toNumberOrNull(row.draw_odds),
        away_win_odds: toNumberOrNull(row.away_win_odds),

        over_2_5_odds: toNumberOrNull(row.over_2_5_odds),
        under_2_5_odds: toNumberOrNull(row.under_2_5_odds),

        btts_yes_odds: toNumberOrNull(row.btts_yes_odds),
        btts_no_odds: toNumberOrNull(row.btts_no_odds),

        odds_locked: lockNow,
        odds_locked_at: lockNow ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from("soccer_match_odds")
        .select("odds_locked")
        .eq("match_id", String(row.match_id))
        .maybeSingle();

      if (existing?.odds_locked) {
        continue;
      }

      const { error } = await supabase
        .from("soccer_match_odds")
        .upsert(payload, { onConflict: "match_id" });

      if (error) {
        return NextResponse.json(
          { error: error.message || "Failed to save odds" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
}