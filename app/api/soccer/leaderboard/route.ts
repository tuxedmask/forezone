import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type EntryRow = {
  id: string;
  user_id: string;
  league_slug: string;
  matchweek_label: string | null;
  status: string | null;
  total_points: number | null;
  graded: boolean | null;
};

type PickRow = {
  entry_id: string;
  points: number | null;
  correct_score_points: number | null;
  graded: boolean | null;
  graded_at: string | null;
  actual_home_score: number | null;
  actual_away_score: number | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const leagueSlug = searchParams.get("leagueSlug");
    const range = searchParams.get("range") || "weekly";
    const matchweekParam = searchParams.get("matchweek");

    if (!leagueSlug) {
      return NextResponse.json(
        { error: "Missing leagueSlug" },
        { status: 400 }
      );
    }

    if (range === "weekly" && !matchweekParam) {
      return NextResponse.json(
        { error: "Missing matchweek" },
        { status: 400 }
      );
    }

    let entriesQuery = supabase
      .from("soccer_prediction_entries")
      .select("id, user_id, league_slug, matchweek_label, status, total_points, graded")
      .eq("league_slug", leagueSlug);

    if (range === "weekly" && matchweekParam) {
      entriesQuery = entriesQuery.eq("matchweek_label", `Week ${matchweekParam}`);
    }

    const { data: entriesData, error: entriesError } = await entriesQuery;

    if (entriesError) {
      console.error("ENTRIES ERROR:", entriesError);
      return NextResponse.json(
        { error: entriesError.message },
        { status: 500 }
      );
    }

    const entries = (entriesData || []) as EntryRow[];

    if (!entries.length) {
      return NextResponse.json({
        leaderboard: [],
        range,
        matchweek: matchweekParam ? Number(matchweekParam) : null,
      });
    }

    const entryIds = entries.map((e) => e.id);

    const { data: picksData, error: picksError } = await supabase
      .from("soccer_prediction_picks")
      .select("entry_id, correct_score_points, points, graded, graded_at, actual_home_score, actual_away_score")
      .in("entry_id", entryIds);

    if (picksError) {
      console.error("PICKS ERROR:", picksError);
      return NextResponse.json(
        { error: picksError.message },
        { status: 500 }
      );
    }

    const picks = (picksData || []) as PickRow[];

    console.log("LEADERBOARD PICKS SAMPLE:", picks.slice(0, 10));

    const userIds = [...new Set(entries.map((e) => e.user_id))];

   const { data: users, error: usersError } = await supabase
  .from("users")
  .select("id, name, image, alias")
  .in("id", userIds);

    if (usersError) {
      console.error("USERS ERROR:", usersError);
      return NextResponse.json(
        { error: usersError.message },
        { status: 500 }
      );
    }

   const userInfo: Record<
  string,
  { name: string; image: string | null; alias: string | null }
> = {};

    for (const u of users || []) {
      userInfo[u.id] = {
  name: u.name || "User",
  image: u.image || null,
  alias: (u as any).alias || null,
};
    }

    const userMap: Record<
  string,
  {
    userId: string;
    userName: string;
    userImage: string | null;
    alias: string | null;
    totalPoints: number;
    correctScores: number;
    picksCount: number;
    pending: number;
  }
> = {};

    const entryToUserId = new Map<string, string>();

    for (const entry of entries) {
      entryToUserId.set(entry.id, entry.user_id);

      if (!userMap[entry.user_id]) {
        userMap[entry.user_id] = {
  userId: entry.user_id,
  userName: userInfo[entry.user_id]?.name || "User",
  userImage: userInfo[entry.user_id]?.image || null,
  alias: userInfo[entry.user_id]?.alias || null,
  totalPoints: 0,
  correctScores: 0,
  picksCount: 0,
  pending: 0,
};
      }
    }

    for (const pick of picks) {
      const userId = entryToUserId.get(pick.entry_id);
      if (!userId || !userMap[userId]) continue;

      userMap[userId].picksCount += 1;

   const hasPoints = pick.points !== null;

     const hasActualResult =
  pick.actual_home_score !== null &&
  pick.actual_away_score !== null;

// add points if they exist
if (pick.points !== null) {
  userMap[userId].totalPoints += Number(pick.points);

  if ((pick.correct_score_points ?? 0) > 0) {
    userMap[userId].correctScores += 1;
  }
}

// count pending based on NO result
if (!hasActualResult) {
  userMap[userId].pending += 1;
}
    }

    const leaderboard = Object.values(userMap)
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }

        if (b.correctScores !== a.correctScores) {
          return b.correctScores - a.correctScores;
        }

        return b.picksCount - a.picksCount;
      })
      .map((user, index) => ({
        rank: index + 1,
        ...user,
      }));

    return NextResponse.json({
      leaderboard,
      range,
      matchweek: matchweekParam ? Number(matchweekParam) : null,
    });
  } catch (error) {
    console.error("SOCCER LEADERBOARD ROUTE ERROR:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}