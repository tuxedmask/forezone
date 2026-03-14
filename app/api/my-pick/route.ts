import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function hasGameStarted(dateString: string) {
  return new Date(dateString).getTime() <= Date.now();
}

function americanToDecimal(input: string): string {
  const cleaned = String(input).trim().replace(/[^\d+.-]/g, "");
  const odds = Number(cleaned);

  if (!cleaned || Number.isNaN(odds) || odds === 0) return "";

  const decimalOdds =
    odds > 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1;

  return decimalOdds.toFixed(2);
}

function decimalToAmerican(input: string): string {
  const cleaned = String(input).trim().replace(/[^\d.]/g, "");
  const odds = Number(cleaned);

  if (!cleaned || Number.isNaN(odds) || odds <= 1) return "";

  if (odds >= 2) {
    return `+${Math.round((odds - 1) * 100)}`;
  }

  return `${Math.round(-100 / (odds - 1))}`;
}

async function getCurrentUserId() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !(session.user as any).appUserId) {
    return null;
  }

  return (session.user as any).appUserId as string;
}

async function getTodaysPick(userId: string) {
  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).toISOString();

  const startOfTomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  ).toISOString();

  const { data, error } = await supabase
    .from("picks")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", startOfToday)
    .lt("created_at", startOfTomorrow)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function PATCH(req: Request) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingPick = await getTodaysPick(userId);

    if (!existingPick) {
      return NextResponse.json(
        { error: "No pick found for today" },
        { status: 404 }
      );
    }

    if (hasGameStarted(existingPick.commence_time)) {
      return NextResponse.json(
        { error: "This pick is locked because the game already started" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const {
      gameId,
      awayTeam,
      homeTeam,
      commenceTime,
      pickType,
      prop,
      americanOdds,
      decimalOdds,
      bookie,
    } = body;

    const missingFields: string[] = [];

    if (!gameId) missingFields.push("gameId");
    if (!awayTeam) missingFields.push("awayTeam");
    if (!homeTeam) missingFields.push("homeTeam");
    if (!commenceTime) missingFields.push("commenceTime");
    if (!pickType) missingFields.push("pickType");
    if (!prop) missingFields.push("prop");
    if (!bookie) missingFields.push("bookie");

    if (
      (americanOdds === undefined ||
        americanOdds === null ||
        String(americanOdds).trim() === "") &&
      (decimalOdds === undefined ||
        decimalOdds === null ||
        String(decimalOdds).trim() === "")
    ) {
      missingFields.push("americanOdds or decimalOdds");
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    if (hasGameStarted(commenceTime)) {
      return NextResponse.json(
        { error: "This game has already started" },
        { status: 400 }
      );
    }

    const trimmedAmericanOdds = String(americanOdds ?? "").trim();
    const trimmedDecimalOdds = String(decimalOdds ?? "").trim();

    let finalAmericanOdds = trimmedAmericanOdds;
    let finalDecimalOdds = trimmedDecimalOdds;

    if (!finalAmericanOdds && finalDecimalOdds) {
      finalAmericanOdds = decimalToAmerican(finalDecimalOdds);
    }

    if (!finalDecimalOdds && finalAmericanOdds) {
      finalDecimalOdds = americanToDecimal(finalAmericanOdds);
    }

    if (!finalAmericanOdds || !finalDecimalOdds) {
      return NextResponse.json(
        { error: "Invalid odds. Please enter valid American or Decimal odds." },
        { status: 400 }
      );
    }

    const decimalNumber = Number(finalDecimalOdds);
    if (Number.isNaN(decimalNumber) || decimalNumber <= 1) {
      return NextResponse.json(
        { error: "Decimal odds must be greater than 1." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("picks")
      .update({
        game_id: gameId,
        away_team: awayTeam,
        home_team: homeTeam,
        commence_time: commenceTime,
        pick_type: pickType,
        prop: String(prop).trim(),
        american_odds: finalAmericanOdds,
        decimal_odds: finalDecimalOdds,
        bookie: String(bookie).trim(),
      })
      .eq("id", existingPick.id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, pick: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update pick" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingPick = await getTodaysPick(userId);

    if (!existingPick) {
      return NextResponse.json(
        { error: "No pick found for today" },
        { status: 404 }
      );
    }

    if (hasGameStarted(existingPick.commence_time)) {
      return NextResponse.json(
        { error: "This pick is locked because the game already started" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("picks")
      .delete()
      .eq("id", existingPick.id)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to delete pick" },
      { status: 500 }
    );
  }
}