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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).appUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).appUserId as string;
    const userName = session.user.name || "User";
    const userImage = session.user.image || null;

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

    const { data: existingPick, error: existingPickError } = await supabase
      .from("picks")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", startOfToday)
      .lt("created_at", startOfTomorrow)
      .limit(1);

    if (existingPickError) {
      return NextResponse.json(
        { error: existingPickError.message },
        { status: 500 }
      );
    }

    if (existingPick && existingPick.length > 0) {
      return NextResponse.json(
        { error: "You already submitted a pick today" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("picks")
      .insert([
        {
          user_id: userId,
          user_name: userName,
          user_image: userImage,
          game_id: gameId,
          away_team: awayTeam,
          home_team: homeTeam,
          commence_time: commenceTime,
          pick_type: pickType,
          prop: String(prop).trim(),
          american_odds: finalAmericanOdds,
          decimal_odds: finalDecimalOdds,
          bookie: String(bookie).trim(),
          result: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, pick: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to submit pick" },
      { status: 500 }
    );
  }
}