import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";
const ODDS_API_BASE_URL = "https://api.the-odds-api.com/v4";

const PREMIER_LEAGUE_CODE = "PL";
const LEAGUE_SLUG = "premier-league";

const DEFAULT_ODDS_SPORT_KEY = process.env.ODDS_SPORT_KEY || "soccer_epl";
const DEFAULT_ODDS_REGION = process.env.ODDS_REGION || "uk";
const DEFAULT_ODDS_FORMAT = process.env.ODDS_FORMAT || "decimal";
const PREFERRED_BOOKMAKER_KEY = process.env.PREFERRED_BOOKMAKER_KEY || "";

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
  matches?: FootballDataMatch[];
  message?: string;
};

type OddsOutcome = {
  name: string;
  price: number;
  point?: number;
};

type OddsMarket = {
  key: string;
  outcomes: OddsOutcome[];
};

type OddsBookmaker = {
  key: string;
  title: string;
  markets: OddsMarket[];
};

type OddsEvent = {
  id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: OddsBookmaker[];
};

function getFootballDataApiKey() {
  return process.env.FOOTBALL_DATA_API_KEY || "";
}

function getOddsApiKey() {
  return process.env.ODDS_API_KEY || "";
}

function normalizeName(name: string | undefined | null) {
  return String(name || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bfc\b/g, "")
    .replace(/\bafc\b/g, "")
    .replace(/\butd\b/g, "united")
    .replace(/\bhotspur\b/g, "")
    .replace(/\bwanderers\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function roughlySameTeam(a?: string | null, b?: string | null) {
  const left = normalizeName(a);
  const right = normalizeName(b);

  if (!left || !right) return false;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;

  const aliases: Record<string, string[]> = {
    wolves: ["wolverhampton", "wolverhampton wanderers"],
    "west ham": ["west ham united"],
    brighton: ["brighton and hove albion", "brighton hove albion"],
    bournemouth: ["afc bournemouth"],
    palace: ["crystal palace"],
    forest: ["nottingham forest"],
    tottenham: ["tottenham hotspur"],
    "man city": ["manchester city"],
    "man united": ["manchester united"],
    newcastle: ["newcastle united"],
  };

  for (const group of Object.values(aliases)) {
    const all = group.map(normalizeName);
    if (all.includes(left) && all.includes(right)) return true;
  }

  return false;
}

function sameKickoff(a: string, b: string) {
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  return Math.abs(ta - tb) <= 15 * 60 * 1000;
}

function shouldLockOdds(kickoff: string) {
  const ts = new Date(kickoff).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() >= ts - 5 * 60 * 1000;
}

function pickBookmaker(bookmakers: OddsBookmaker[] | undefined) {
  if (!Array.isArray(bookmakers) || bookmakers.length === 0) return null;

  if (PREFERRED_BOOKMAKER_KEY) {
    const exact = bookmakers.find((b) => b.key === PREFERRED_BOOKMAKER_KEY);
    if (exact) return exact;
  }

  return bookmakers[0] || null;
}

function getMarket(bookmaker: OddsBookmaker | null, key: string) {
  if (!bookmaker) return null;
  return bookmaker.markets?.find((m) => m.key === key) || null;
}

function getH2HOdds(
  bookmaker: OddsBookmaker | null,
  homeTeam: string,
  awayTeam: string
) {
  const market = getMarket(bookmaker, "h2h");
  const outcomes = market?.outcomes || [];

  return {
    home_win_odds:
      outcomes.find((o) => roughlySameTeam(o.name, homeTeam))?.price ?? null,
    draw_odds:
      outcomes.find((o) => normalizeName(o.name) === "draw")?.price ?? null,
    away_win_odds:
      outcomes.find((o) => roughlySameTeam(o.name, awayTeam))?.price ?? null,
  };
}

function getTotals25Odds(bookmaker: OddsBookmaker | null) {
  const market = getMarket(bookmaker, "totals");
  const outcomes = market?.outcomes || [];

  const over25 = outcomes.find(
    (o) => String(o.name).toLowerCase() === "over" && Number(o.point) === 2.5
  );

  const under25 = outcomes.find(
    (o) => String(o.name).toLowerCase() === "under" && Number(o.point) === 2.5
  );

  return {
    over_2_5_odds: over25?.price ?? null,
    under_2_5_odds: under25?.price ?? null,
  };
}

async function fetchFootballMatches() {
  const footballDataApiKey = getFootballDataApiKey();
  if (!footballDataApiKey) throw new Error("Missing FOOTBALL_DATA_API_KEY");

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
    throw new Error(data?.message || "Failed to load football-data matches");
  }

  return Array.isArray(data.matches) ? data.matches : [];
}

async function fetchOddsEvents() {
  const oddsApiKey = getOddsApiKey();
  if (!oddsApiKey) throw new Error("Missing ODDS_API_KEY");

  const url =
    `${ODDS_API_BASE_URL}/sports/${DEFAULT_ODDS_SPORT_KEY}/odds` +
    `?apiKey=${encodeURIComponent(oddsApiKey)}` +
    `&regions=${encodeURIComponent(DEFAULT_ODDS_REGION)}` +
    `&markets=h2h,totals` +
    `&oddsFormat=${encodeURIComponent(DEFAULT_ODDS_FORMAT)}`;

  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Odds API error ${res.status}: ${text}`);
  }

  const data = JSON.parse(text) as OddsEvent[];
  return Array.isArray(data) ? data : [];
}

export async function GET() {
  try {
    const matches = await fetchFootballMatches();
    const oddsEvents = await fetchOddsEvents();

    let saved = 0;
    let locked = 0;
    let skippedLocked = 0;
    let missingOdds = 0;

    for (const m of matches) {
      const matchId = String(m.id);
      const kickoff = m.utcDate;
      const homeName = m.homeTeam?.name || m.homeTeam?.shortName || "Home Team";
      const awayName = m.awayTeam?.name || m.awayTeam?.shortName || "Away Team";

      const { data: existing } = await supabase
        .from("soccer_match_odds")
        .select("id, odds_locked")
        .eq("match_id", matchId)
        .maybeSingle();

      if (existing?.odds_locked) {
        skippedLocked++;
        continue;
      }

      const matchedOddsEvent =
        oddsEvents.find(
          (event) =>
            sameKickoff(event.commence_time, kickoff) &&
            roughlySameTeam(event.home_team, homeName) &&
            roughlySameTeam(event.away_team, awayName)
        ) ||
        oddsEvents.find(
          (event) =>
            roughlySameTeam(event.home_team, homeName) &&
            roughlySameTeam(event.away_team, awayName)
        ) ||
        oddsEvents.find(
          (event) =>
            sameKickoff(event.commence_time, kickoff) &&
            ((roughlySameTeam(event.home_team, homeName) &&
              roughlySameTeam(event.away_team, awayName)) ||
              (roughlySameTeam(event.home_team, awayName) &&
                roughlySameTeam(event.away_team, homeName)))
        ) ||
        null;

      let odds = {
        home_win_odds: null as number | null,
        draw_odds: null as number | null,
        away_win_odds: null as number | null,
        over_2_5_odds: null as number | null,
        under_2_5_odds: null as number | null,
        btts_yes_odds: null as number | null,
        btts_no_odds: null as number | null,
        bookmaker: null as string | null,
      };

      if (matchedOddsEvent) {
        const bookmaker = pickBookmaker(matchedOddsEvent.bookmakers);

        odds = {
          ...odds,
          bookmaker: bookmaker?.title || bookmaker?.key || null,
          ...getH2HOdds(bookmaker, matchedOddsEvent.home_team, matchedOddsEvent.away_team),
          ...getTotals25Odds(bookmaker),
        };
      } else {
        missingOdds++;
      }

      const lockNow = shouldLockOdds(kickoff);

      const payload = {
        match_id: matchId,
        league_slug: LEAGUE_SLUG,
        home_team: homeName,
        away_team: awayName,
        kickoff,
        bookmaker: odds.bookmaker,
        home_win_odds: odds.home_win_odds,
        draw_odds: odds.draw_odds,
        away_win_odds: odds.away_win_odds,
        over_2_5_odds: odds.over_2_5_odds,
        under_2_5_odds: odds.under_2_5_odds,
        btts_yes_odds: odds.btts_yes_odds,
        btts_no_odds: odds.btts_no_odds,
        odds_locked: lockNow,
        odds_locked_at: lockNow ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("soccer_match_odds")
        .upsert(payload, { onConflict: "match_id" });

      if (error) {
        throw new Error(error.message);
      }

      saved++;
      if (lockNow) locked++;
    }

    return NextResponse.json({
      success: true,
      saved,
      locked,
      skippedLocked,
      missingOdds,
      matchesProcessed: matches.length,
      oddsEventsFound: oddsEvents.length,
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