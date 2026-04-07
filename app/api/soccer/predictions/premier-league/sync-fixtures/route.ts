import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";
const PREMIER_LEAGUE_CODE = "PL";
const LEAGUE_SLUG = "premier-league";

type FootballDataMatch = {
  id: number;
  utcDate: string;
  matchday: number | null;
  status?: string;
  homeTeam?: {
    name?: string;
    shortName?: string;
    crest?: string | null;
  };
  awayTeam?: {
    name?: string;
    shortName?: string;
    crest?: string | null;
  };
};

type FootballDataMatchesResponse = {
  competition?: {
    name?: string;
    code?: string;
  };
  matches?: FootballDataMatch[];
  message?: string;
};

function getFootballDataApiKey() {
  return process.env.FOOTBALL_DATA_API_KEY || "";
}

export async function GET() {
  try {
    const footballDataApiKey = getFootballDataApiKey();

    if (!footballDataApiKey) {
      return NextResponse.json(
        { error: "Missing FOOTBALL_DATA_API_KEY" },
        { status: 500 }
      );
    }

    const res = await fetch(
      `${FOOTBALL_DATA_BASE_URL}/competitions/${PREMIER_LEAGUE_CODE}/matches?status=SCHEDULED`,
      {
        headers: {
          "X-Auth-Token": footballDataApiKey,
        },
        cache: "no-store",
      }
    );

    const data = (await res.json()) as FootballDataMatchesResponse;

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message || "Failed to load fixtures" },
        { status: res.status }
      );
    }

    const matches = Array.isArray(data.matches) ? data.matches : [];
    const leagueName = data.competition?.name || "Premier League";

    let saved = 0;

    for (const match of matches) {
      const payload = {
        match_id: String(match.id),
        league_slug: LEAGUE_SLUG,
        league_name: leagueName,
        matchday: match.matchday,
        kickoff: match.utcDate,
        home_team: match.homeTeam?.shortName || match.homeTeam?.name || "Home Team",
        away_team: match.awayTeam?.shortName || match.awayTeam?.name || "Away Team",
        home_logo: match.homeTeam?.crest || "",
        away_logo: match.awayTeam?.crest || "",
        status: String(match.status || "SCHEDULED").toLowerCase(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("soccer_fixtures")
        .upsert(payload, { onConflict: "match_id" });

      if (error) {
        return NextResponse.json(
          { error: error.message || "Failed to save fixtures" },
          { status: 500 }
        );
      }

      saved++;
    }

    return NextResponse.json({
      success: true,
      saved,
      leagueName,
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