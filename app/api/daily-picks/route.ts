import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function getEasternDateString(dateInput: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(dateInput));
}

export async function GET(req: NextRequest) {
  try {
    const dateParam = req.nextUrl.searchParams.get("date");
    const selectedDate = dateParam || getEasternDateString(new Date().toISOString());

    const { data, error } = await supabase
      .from("picks")
      .select("*")
      .order("commence_time", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const filtered = (data ?? []).filter((pick) => {
      if (!pick.commence_time) return false;
      return getEasternDateString(pick.commence_time) === selectedDate;
    });

    return NextResponse.json(filtered);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load picks" },
      { status: 500 }
    );
  }
}