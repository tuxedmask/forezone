import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).appUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).appUserId as string;

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      hasPick: !!data,
      pick: data ?? null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to check today's pick" },
      { status: 500 }
    );
  }
}