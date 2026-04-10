import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function cleanAlias(value: unknown) {
  return String(value ?? "").trim();
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const appUserId = (session?.user as any)?.appUserId as string | undefined;

    if (!appUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const alias = cleanAlias(searchParams.get("alias"));

    if (!alias) {
      return NextResponse.json({ available: false, message: "" });
    }

    if (alias.length < 2) {
      return NextResponse.json({
        available: false,
        message: "Alias must be at least 2 characters.",
      });
    }

    if (alias.length > 24) {
      return NextResponse.json({
        available: false,
        message: "Alias must be 24 characters or less.",
      });
    }

    const allowed = /^[a-zA-Z0-9 _.-]+$/;
    if (!allowed.test(alias)) {
      return NextResponse.json({
        available: false,
        message: "Invalid characters in alias.",
      });
    }

    const { data, error } = await supabase
      .from("users")
      .select("id")
      .neq("id", appUserId)
      .ilike("alias", alias)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (data) {
      return NextResponse.json({
        available: false,
        message: "That alias is already taken.",
      });
    }

    return NextResponse.json({
      available: true,
      message: "Alias is available.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        available: false,
        message:
          error instanceof Error ? error.message : "Something went wrong.",
      },
      { status: 500 }
    );
  }
}