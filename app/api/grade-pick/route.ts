import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pickId, result } = body;

    if (!pickId || !["win", "loss", "pending"].includes(result)) {
      return NextResponse.json(
        { error: "Invalid pickId or result" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("picks")
      .update({
        result,
        settled_at: new Date().toISOString(),
      })
      .eq("id", pickId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, pick: data });
  } catch (error) {
    console.error("grade-pick error:", error);
    return NextResponse.json(
      { error: "Failed to grade pick" },
      { status: 500 }
    );
  }
}