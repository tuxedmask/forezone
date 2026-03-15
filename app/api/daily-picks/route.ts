import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const dateParam = req.nextUrl.searchParams.get("date");

    const selectedDate =
      dateParam || new Date().toISOString().slice(0, 10);

    const start = new Date(`${selectedDate}T00:00:00.000`);
    const end = new Date(`${selectedDate}T23:59:59.999`);

    const { data, error } = await supabase
      .from("picks")
      .select("*")
      .gte("commence_time", start.toISOString())
      .lte("commence_time", end.toISOString())
      .order("commence_time", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load picks" },
      { status: 500 }
    );
  }
}