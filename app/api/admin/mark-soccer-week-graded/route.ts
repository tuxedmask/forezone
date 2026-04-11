import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const leagueSlug = body.leagueSlug;
    const matchweekLabel = body.matchweekLabel;

    if (!leagueSlug || !matchweekLabel) {
      return NextResponse.json(
        { error: "Missing data" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("soccer_week_status")
      .upsert(
        {
          league_slug: leagueSlug,
          matchweek_label: matchweekLabel,
          is_graded: true,
          graded_at: new Date().toISOString(),
        },
        {
          onConflict: "league_slug,matchweek_label",
        }
      );

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}