import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function getEasternResetWindow() {
  const now = new Date();

  const easternNow = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );

  const resetStartEastern = new Date(easternNow);
  resetStartEastern.setHours(2, 0, 0, 0);

  if (easternNow < resetStartEastern) {
    resetStartEastern.setDate(resetStartEastern.getDate() - 1);
  }

  const resetEndEastern = new Date(resetStartEastern);
  resetEndEastern.setDate(resetEndEastern.getDate() + 1);

  const startDiff = now.getTime() - easternNow.getTime();

  const resetStartUtc = new Date(resetStartEastern.getTime() + startDiff);
  const resetEndUtc = new Date(resetEndEastern.getTime() + startDiff);

  return {
    startOfWindow: resetStartUtc.toISOString(),
    endOfWindow: resetEndUtc.toISOString(),
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).appUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).appUserId as string;

    const { startOfWindow, endOfWindow } = getEasternResetWindow();

    const { data, error } = await supabase
      .from("picks")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", startOfWindow)
      .lt("created_at", endOfWindow)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      hasPick: !!data,
      pick: data ?? null,
      debug: {
        startOfWindow,
        endOfWindow,
        now: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to check today's pick" },
      { status: 500 }
    );
  }
}