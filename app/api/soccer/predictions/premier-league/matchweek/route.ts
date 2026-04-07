import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type FixtureRow = {
  match_id: string;
  league_slug: string;
  league_name: string;
  matchday: number | null;
  kickoff: string;
  home_team: string;
  away_team: string;
  home_logo: string | null;
  away_logo: string | null;
  status: string | null;
};

type SavedOddsRow = {
  match_id: string;
  home_win_odds: number | null;
  draw_odds: number | null;
  away_win_odds: number | null;
  over_2_5_odds: number | null;
  under_2_5_odds: number | null;
  btts_yes_odds: number | null;
  btts_no_odds: number | null;
};

function formatMatch(fixture: FixtureRow, odds?: SavedOddsRow | null) {
  return {
    id: Number(fixture.match_id),
    kickoff: fixture.kickoff,
    matchday: fixture.matchday,
    home: fixture.home_team || "Home Team",
    away: fixture.away_team || "Away Team",
    homeLogo: fixture.home_logo || "",
    awayLogo: fixture.away_logo || "",
    home_win_odds: odds?.home_win_odds ?? null,
    draw_odds: odds?.draw_odds ?? null,
    away_win_odds: odds?.away_win_odds ?? null,
    over_2_5_odds: odds?.over_2_5_odds ?? null,
    under_2_5_odds: odds?.under_2_5_odds ?? null,
    btts_yes_odds: odds?.btts_yes_odds ?? null,
    btts_no_odds: odds?.btts_no_odds ?? null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const requestedMatchweek = req.nextUrl.searchParams.get("matchweek");

    const { data: fixtureRows, error: fixturesError } = await supabase
      .from("soccer_fixtures")
      .select(
        "match_id, league_slug, league_name, matchday, kickoff, home_team, away_team, home_logo, away_logo, status"
      )
      .eq("league_slug", "premier-league")
      .in("status", ["scheduled", "timed"])
      .order("kickoff", { ascending: true });

    if (fixturesError) {
      return NextResponse.json(
        { error: fixturesError.message || "Failed to load fixtures" },
        { status: 500 }
      );
    }

    const fixtures = (fixtureRows || []) as FixtureRow[];

    if (fixtures.length === 0) {
      return NextResponse.json({
        leagueSlug: "premier-league",
        leagueName: "Premier League",
        matchweekLabel: null,
        matchday: null,
        matches: [],
        availableMatchweeks: [],
      });
    }

    const matchdays = Array.from(
      new Set(
        fixtures
          .map((m) => m.matchday)
          .filter((v): v is number => typeof v === "number")
      )
    ).sort((a, b) => a - b);

    const currentMatchday = matchdays[0] ?? null;

    let selectedMatchday = currentMatchday;

    if (requestedMatchweek) {
      const parsed = Number(requestedMatchweek.replace("Week ", ""));
      if (!Number.isNaN(parsed)) {
        selectedMatchday = parsed;
      }
    }

    const selectedFixtures = fixtures
      .filter((m) => m.matchday === selectedMatchday)
      .sort(
        (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
      );

    const availableMatchweeks = matchdays.map((m) => ({
      value: `Week ${m}`,
      label: `Week ${m}`,
    }));

    const selectedMatchIds = selectedFixtures.map((m) => String(m.match_id));

    let savedOdds: SavedOddsRow[] = [];

    if (selectedMatchIds.length > 0) {
      const { data, error } = await supabase
        .from("soccer_match_odds")
        .select(
          "match_id, home_win_odds, draw_odds, away_win_odds, over_2_5_odds, under_2_5_odds, btts_yes_odds, btts_no_odds"
        )
        .eq("league_slug", "premier-league")
        .in("match_id", selectedMatchIds);

      if (error) {
        return NextResponse.json(
          { error: error.message || "Failed to load saved odds" },
          { status: 500 }
        );
      }

      savedOdds = (data || []) as SavedOddsRow[];
    }

    const oddsMap = new Map<string, SavedOddsRow>();
    for (const row of savedOdds) {
      oddsMap.set(String(row.match_id), row);
    }

    const enrichedMatches = selectedFixtures.map((fixture) => {
      const odds = oddsMap.get(String(fixture.match_id)) || null;
      return formatMatch(fixture, odds);
    });

    return NextResponse.json({
      leagueSlug: "premier-league",
      leagueName: fixtures[0]?.league_name || "Premier League",
      matchweekLabel:
        selectedMatchday !== null ? `Week ${selectedMatchday}` : null,
      matchday: selectedMatchday,
      matches: enrichedMatches,
      availableMatchweeks,
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