import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type ResultRow = {
  match_id: string;
  league_slug: string;
  matchweek_label: string | null;
  home_team: string | null;
  away_team: string | null;
  kickoff: string | null;
  home_score: number | null;
  away_score: number | null;
  updated_at?: string | null;
};

export async function GET(req: NextRequest) {
  try {
    const leagueSlug =
      req.nextUrl.searchParams.get("leagueSlug") || "premier-league";
    const matchweekLabel = req.nextUrl.searchParams.get("matchweek");

    let query = supabase
      .from("soccer_match_results")
      .select(
        "match_id, league_slug, matchweek_label, home_team, away_team, kickoff, home_score, away_score, updated_at"
      )
      .eq("league_slug", String(leagueSlug))
      .order("kickoff", { ascending: true });

    if (matchweekLabel) {
      query = query.eq("matchweek_label", String(matchweekLabel));
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to load results" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      rows: (data || []) as ResultRow[],
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leagueSlug, matchweekLabel, rows } = body ?? {};

    if (!leagueSlug || !Array.isArray(rows)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const sanitizedRows = rows
      .filter(
        (row: any) =>
          row &&
          row.match_id &&
          row.home_score !== undefined &&
          row.away_score !== undefined &&
          row.home_score !== null &&
          row.away_score !== null &&
          row.home_score !== "" &&
          row.away_score !== ""
      )
      .map((row: any) => ({
        match_id: String(row.match_id),
        league_slug: String(leagueSlug),
        matchweek_label: matchweekLabel ? String(matchweekLabel) : null,
        home_team: row.home_team ? String(row.home_team) : null,
        away_team: row.away_team ? String(row.away_team) : null,
        kickoff: row.kickoff ? String(row.kickoff) : null,
        home_score: Number(row.home_score),
        away_score: Number(row.away_score),
        updated_at: new Date().toISOString(),
      }));

    if (sanitizedRows.length === 0) {
      return NextResponse.json(
        { error: "No valid result rows provided" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("soccer_match_results")
      .upsert(sanitizedRows, {
        onConflict: "match_id",
      });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to save results" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      saved: sanitizedRows.length,
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