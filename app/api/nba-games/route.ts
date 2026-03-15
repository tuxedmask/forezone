import { NextRequest, NextResponse } from "next/server";

type EspnGame = {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
};

function getDatePartsInEastern(dateInput: Date | string) {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);

  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value || "00";

  let year = Number(getPart("year"));
  let month = Number(getPart("month"));
  let day = Number(getPart("day"));
  const hour = Number(getPart("hour"));

  if (hour < 2) {
    const rolloverDate = new Date(Date.UTC(year, month - 1, day));
    rolloverDate.setUTCDate(rolloverDate.getUTCDate() - 1);

    year = rolloverDate.getUTCFullYear();
    month = rolloverDate.getUTCMonth() + 1;
    day = rolloverDate.getUTCDate();
  }

  return { year, month, day };
}

function getTodayForeZoneDateString() {
  const parts = getDatePartsInEastern(new Date());

  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(
    parts.day
  ).padStart(2, "0")}`;
}

function parseSelectedDate(dateParam: string | null) {
  if (!dateParam) {
    const [year, month, day] = getTodayForeZoneDateString()
      .split("-")
      .map(Number);

    return { year, month, day };
  }

  const [year, month, day] = dateParam.split("-").map(Number);

  if (!year || !month || !day) {
    throw new Error("Invalid date format. Expected YYYY-MM-DD");
  }

  return { year, month, day };
}

function isGameInSelectedForeZoneDay(
  commenceTime: string,
  selectedDate: { year: number; month: number; day: number }
) {
  const gameParts = getDatePartsInEastern(commenceTime);

  return (
    gameParts.year === selectedDate.year &&
    gameParts.month === selectedDate.month &&
    gameParts.day === selectedDate.day
  );
}

async function fetchEspnGamesForDate(selectedDate: {
  year: number;
  month: number;
  day: number;
}) {
  const espnDate = `${selectedDate.year}${String(selectedDate.month).padStart(
    2,
    "0"
  )}${String(selectedDate.day).padStart(2, "0")}`;

  const res = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${espnDate}`,
    {
      next: { revalidate: 1800 },
    }
  );

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  const data = text ? JSON.parse(text) : {};
  const events = Array.isArray(data?.events) ? data.events : [];

  const games: EspnGame[] = events
    .map((event: any) => {
      const competition = event?.competitions?.[0];
      const competitors = Array.isArray(competition?.competitors)
        ? competition.competitors
        : [];

      const home = competitors.find((team: any) => team.homeAway === "home");
      const away = competitors.find((team: any) => team.homeAway === "away");

      if (!event?.id || !event?.date || !home || !away) {
        return null;
      }

      return {
        id: String(event.id),
        home_team: home.team?.displayName || "Home Team",
        away_team: away.team?.displayName || "Away Team",
        commence_time: event.date,
      };
    })
    .filter(Boolean) as EspnGame[];

  return games;
}

export async function GET(req: NextRequest) {
  try {
    const dateParam = req.nextUrl.searchParams.get("date");
    const selectedDate = parseSelectedDate(dateParam);

    const games = await fetchEspnGamesForDate(selectedDate);

    const simplifiedGames = games
      .filter((game) =>
        isGameInSelectedForeZoneDay(game.commence_time, selectedDate)
      )
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