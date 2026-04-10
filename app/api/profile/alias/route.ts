import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

function cleanAlias(value: unknown) {
  return String(value ?? "").trim();
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const appUserId = (session?.user as any)?.appUserId as string | undefined;

    if (!appUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const alias = cleanAlias(body?.alias);

    if (!alias) {
      return NextResponse.json(
        { error: "Alias is required." },
        { status: 400 }
      );
    }

    if (alias.length < 2) {
      return NextResponse.json(
        { error: "Alias must be at least 2 characters." },
        { status: 400 }
      );
    }

    if (alias.length > 24) {
      return NextResponse.json(
        { error: "Alias must be 24 characters or less." },
        { status: 400 }
      );
    }

    const allowed = /^[a-zA-Z0-9 _.-]+$/;
    if (!allowed.test(alias)) {
      return NextResponse.json(
        { error: "Use only letters, numbers, spaces, dots, dashes, and underscores." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("users")
      .update({ alias })
      .eq("id", appUserId);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, alias });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Something went wrong.",
      },
      { status: 500 }
    );
  }
}