import { NextResponse } from "next/server";

const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";
const PREMIER_LEAGUE_CODE = "PL";

type FootballDataMatch = {
  id: number;
  utcDate: string;
  matchday: number | null;
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
};

function getApiKey() {
  return process.env.FOOTBALL_DATA_API_KEY || "";
}

export async function GET() {
  try {
    const apiKey = getApiKey();

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing FOOTBALL_DATA_API_KEY" },
        { status: 500 }
      );
    }

    const res = await fetch(
      `${FOOTBALL_DATA_BASE_URL}/competitions/${PREMIER_LEAGUE_CODE}/matches?status=SCHEDULED`,
      {
        headers: {
          "X-Auth-Token": apiKey,
        },
        cache: "no-store",
      }
    );

    const data = (await res.json()) as FootballDataMatchesResponse & {
      message?: string;
    };

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message || "Failed to load Premier League matches" },
        { status: res.status }
      );
    }

    const matches = Array.isArray(data.matches) ? data.matches : [];

    if (matches.length === 0) {
      return NextResponse.json({
        leagueSlug: "premier-league",
        leagueName: "Premier League",
        matchweekLabel: null,
        matchday: null,
        matches: [],
      });
    }

    // Use the earliest scheduled matchday as the active upcoming gameweek
    const upcomingMatchdays = matches
      .map((m) => m.matchday)
      .filter((v): v is number => typeof v === "number")
      .sort((a, b) => a - b);

    const currentMatchday = upcomingMatchdays[0] ?? null;

    const currentMatchweekMatches = matches
      .filter((m) => m.matchday === currentMatchday)
      .sort(
        (a, b) =>
          new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
      )
      .map((m) => ({
        id: m.id,
        kickoff: m.utcDate,
        matchday: m.matchday,
        home: m.homeTeam?.shortName || m.homeTeam?.name || "Home Team",
        away: m.awayTeam?.shortName || m.awayTeam?.name || "Away Team",
        homeLogo: m.homeTeam?.crest || "",
        awayLogo: m.awayTeam?.crest || "",
      }));

    return NextResponse.json({
      leagueSlug: "premier-league",
      leagueName: data.competition?.name || "Premier League",
      matchweekLabel:
        currentMatchday !== null ? `Week ${currentMatchday}` : null,
      matchday: currentMatchday,
      matches: currentMatchweekMatches,
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