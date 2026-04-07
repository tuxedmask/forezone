import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leagueSlug, matchweek } = body ?? {};

    if (!leagueSlug || !matchweek) {
      return NextResponse.json(
        { error: "Missing leagueSlug or matchweek" },
        { status: 400 }
      );
    }

    // 1. Fetch matches from your existing endpoint
    const matchesRes = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/soccer/predictions/${leagueSlug}/matchweek?matchweek=${matchweek}`,
      { cache: "no-store" }
    );

    const matchesData = await matchesRes.json();

    const matches = matchesData?.matches || [];

    if (!matches.length) {
      return NextResponse.json({
        success: false,
        message: "No matches found",
      });
    }

    // 2. Build results array (ONLY finished matches)
    const results = matches
      .filter((m: any) => m.status === "FINISHED")
      .map((m: any) => ({
        match_id: String(m.id),
        actual_home_score: Number(m.homeScore),
        actual_away_score: Number(m.awayScore),
      }));

    if (results.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No finished matches to grade yet",
      });
    }

    // 3. Call YOUR grading route
    const gradeRes = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/soccer/grade`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leagueSlug,
          matchweekLabel: `Week ${matchweek}`,
          results,
        }),
      }
    );

    const gradeData = await gradeRes.json();

    return NextResponse.json({
      success: true,
      autoGradedMatches: results.length,
      ...gradeData,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Auto-grade failed",
      },
      { status: 500 }
    );
  }
}