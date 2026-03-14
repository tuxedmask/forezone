import { NextResponse } from "next/server";

const ODDS_API_KEY = process.env.ODDS_API_KEY;

type OddsOrScoreGame = {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
};

function getEasternWindowParts() {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);

  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value || "00";

  let year = Number(getPart("year"));
  let month = Number(getPart("month"));
  let day = Number(getPart("day"));
  const hour = Number(getPart("hour"));

  // Fore Zone day rolls over at 2:00 AM ET
  if (hour < 2) {
    const rolloverDate = new Date(Date.UTC(year, month - 1, day));
    rolloverDate.setUTCDate(rolloverDate.getUTCDate() - 1);

    year = rolloverDate.getUTCFullYear();
    month = rolloverDate.getUTCMonth() + 1;
    day = rolloverDate.getUTCDate();
  }

  return { year, month, day };
}

function isGameInForeZoneDay(commenceTime: string) {
  const gameDate = new Date(commenceTime);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(gameDate);

  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value || "00";

  let year = Number(getPart("year"));
  let month = Number(getPart("month"));
  let day = Number(getPart("day"));
  const hour = Number(getPart("hour"));

  // Games between 12:00 AM and 1:59 AM ET belong to previous Fore Zone day
  if (hour < 2) {
    const rolloverDate = new Date(Date.UTC(year, month - 1, day));
    rolloverDate.setUTCDate(rolloverDate.getUTCDate() - 1);

    year = rolloverDate.getUTCFullYear();
    month = rolloverDate.getUTCMonth() + 1;
    day = rolloverDate.getUTCDate();
  }

  const todayWindow = getEasternWindowParts();

  return (
    year === todayWindow.year &&
    month === todayWindow.month &&
    day === todayWindow.day
  );
}

async function fetchJson(url: string) {
  const res = await fetch(url, {
    next: { revalidate: 60 },
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  return text ? JSON.parse(text) : [];
}

export async function GET() {
  if (!ODDS_API_KEY) {
    return NextResponse.json(
      { error: "Missing ODDS_API_KEY in environment variables" },
      { status: 500 }
    );
  }

  try {
    const oddsUrl = new URL(
      "https://api.the-odds-api.com/v4/sports/basketball_nba/odds"
    );
    oddsUrl.searchParams.set("apiKey", ODDS_API_KEY);
    oddsUrl.searchParams.set("regions", "us");
    oddsUrl.searchParams.set("markets", "h2h");
    oddsUrl.searchParams.set("oddsFormat", "american");

    const scoresUrl = new URL(
      "https://api.the-odds-api.com/v4/sports/basketball_nba/scores"
    );
    scoresUrl.searchParams.set("apiKey", ODDS_API_KEY);
    scoresUrl.searchParams.set("daysFrom", "1");

    const [oddsData, scoresData] = await Promise.all([
      fetchJson(oddsUrl.toString()),
      fetchJson(scoresUrl.toString()),
    ]);

    const combinedMap = new Map<string, OddsOrScoreGame>();

    for (const game of Array.isArray(scoresData) ? scoresData : []) {
      if (game?.id && game?.commence_time) {
        combinedMap.set(game.id, {
          id: game.id,
          home_team: game.home_team,
          away_team: game.away_team,
          commence_time: game.commence_time,
        });
      }
    }

    for (const game of Array.isArray(oddsData) ? oddsData : []) {
      if (game?.id && game?.commence_time) {
        combinedMap.set(game.id, {
          id: game.id,
          home_team: game.home_team,
          away_team: game.away_team,
          commence_time: game.commence_time,
        });
      }
    }

    const simplifiedGames = Array.from(combinedMap.values())
      .filter((game) => isGameInForeZoneDay(game.commence_time))
      .sort(
        (a, b) =>
          new Date(a.commence_time).getTime() -
          new Date(b.commence_time).getTime()
      );

    return NextResponse.json(simplifiedGames);
  } catch (error: any) {
    console.error("NBA games route error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while fetching NBA games",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}