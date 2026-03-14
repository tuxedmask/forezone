import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    const { data, error } = await supabase
      .from("picks")
      .select("*")
      .gte("created_at", startOfToday)
      .lt("created_at", startOfTomorrow)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("daily-picks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily picks" },
      { status: 500 }
    );
  }
}