import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type PickRow = {
  user_id: string;
  user_name: string;
  user_image: string | null;
  american_odds: string;
  result: string | null;
  created_at: string;
};

function americanOddsToUnits(odds: string) {
  const n = Number(odds);
  if (Number.isNaN(n) || n === 0) return 0;

  if (n > 0) return n / 100;
  return 100 / Math.abs(n);
}

function isValidDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidMonthString(value: string) {
  return /^\d{4}-\d{2}$/.test(value);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const range = searchParams.get("range") ?? "all";
    const date = searchParams.get("date");
    const month = searchParams.get("month");

    let query = supabase
      .from("picks")
      .select("user_id,user_name,user_image,american_odds,result,created_at");

    if (range === "daily") {
      const selectedDate =
        date && isValidDateString(date)
          ? date
          : new Date().toISOString().slice(0, 10);

      const startOfDay = new Date(`${selectedDate}T00:00:00.000Z`);
      const endOfDay = new Date(`${selectedDate}T00:00:00.000Z`);
      endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

      query = query
        .gte("created_at", startOfDay.toISOString())
        .lt("created_at", endOfDay.toISOString());
    } else if (range === "monthly") {
      const selectedMonth =
        month && isValidMonthString(month)
          ? month
          : new Date().toISOString().slice(0, 7);

      const startOfMonth = new Date(`${selectedMonth}-01T00:00:00.000Z`);
      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setUTCMonth(endOfMonth.getUTCMonth() + 1);

      query = query
        .gte("created_at", startOfMonth.toISOString())
        .lt("created_at", endOfMonth.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []) as PickRow[];

    const map = new Map<
      string,
      {
        userId: string;
        userName: string;
        userImage: string | null;
        wins: number;
        losses: number;
        pending: number;
        total: number;
        units: number;
      }
    >();

    for (const row of rows) {
      const key = row.user_id;

      const current = map.get(key) ?? {
        userId: row.user_id,
        userName: row.user_name,
        userImage: row.user_image,
        wins: 0,
        losses: 0,
        pending: 0,
        total: 0,
        units: 0,
      };

      current.total += 1;

      if (row.result === "win") {
        current.wins += 1;
        current.units += americanOddsToUnits(row.american_odds);
      } else if (row.result === "loss") {
        current.losses += 1;
        current.units -= 1;
      } else {
        current.pending += 1;
      }

      map.set(key, current);
    }

    const leaderboard = Array.from(map.values())
      .map((user) => ({
        ...user,
        winPct:
          user.wins + user.losses > 0
            ? ((user.wins / (user.wins + user.losses)) * 100).toFixed(1)
            : "0.0",
        units: Number(user.units.toFixed(2)),
      }))
      .sort((a, b) => b.units - a.units || b.wins - a.wins);

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("leaderboard error:", error);
    return NextResponse.json(
      { error: "Failed to build leaderboard" },
      { status: 500 }
    );
  }
}