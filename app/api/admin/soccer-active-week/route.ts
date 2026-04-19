import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("soccer_admin_state")
      .select("league_slug, forced_matchweek, updated_at")
      .eq("league_slug", "premier-league")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      leagueSlug: "premier-league",
      forcedMatchweek: data?.forced_matchweek ?? null,
      updatedAt: data?.updated_at ?? null,
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const forcedMatchweek = Number(body?.forcedMatchweek);

    if (!Number.isInteger(forcedMatchweek) || forcedMatchweek < 1) {
      return NextResponse.json(
        { error: "Invalid forcedMatchweek" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("soccer_admin_state")
      .upsert(
        {
          league_slug: "premier-league",
          forced_matchweek: forcedMatchweek,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "league_slug" }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      leagueSlug: "premier-league",
      forcedMatchweek,
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