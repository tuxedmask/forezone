import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    const appUserId = (session?.user as { appUserId?: string } | undefined)?.appUserId;

    if (!appUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const provider = body?.provider;

    if (provider !== "discord" && provider !== "twitch") {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("account_link_tokens")
      .insert({
        user_id: appUserId,
        target_provider: provider,
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (error) {
      console.error("account-link/start insert error", error);
      return NextResponse.json({ error: "Failed to create link token" }, { status: 500 });
    }

    const response = NextResponse.json({ ok: true });

    response.cookies.set("fz_link_token", data.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });

    return response;
  } catch (error) {
    console.error("account-link/start route error", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}