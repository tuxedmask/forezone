import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import LinkAccountsCard from "./LinkAccountsCard";
import PickHistoryTabs, { PickRow } from "./PickHistoryTabs";

type LinkedAccountRow = {
  provider: "discord" | "twitch";
  email: string | null;
};

function calculateStats(picks: PickRow[]) {
  const graded = picks.filter(
    (pick) =>
      pick.result === "win" ||
      pick.result === "loss" ||
      pick.result === "push"
  );

  const wins = graded.filter((pick) => pick.result === "win").length;
  const losses = graded.filter((pick) => pick.result === "loss").length;
  const pushes = graded.filter((pick) => pick.result === "push").length;

  const totalDecisions = wins + losses;
  const winPct =
    totalDecisions > 0 ? ((wins / totalDecisions) * 100).toFixed(1) : "0.0";

  let currentStreak = 0;
  let currentStreakType: "W" | "L" | null = null;

  for (const pick of graded) {
    if (pick.result === "push") continue;

    const type = pick.result === "win" ? "W" : "L";

    if (!currentStreakType) {
      currentStreakType = type;
      currentStreak = 1;
    } else if (currentStreakType === type) {
      currentStreak++;
    } else {
      break;
    }
  }

  let bestWinStreak = 0;
  let tempWin = 0;

  for (let i = graded.length - 1; i >= 0; i--) {
    const pick = graded[i];

    if (pick.result === "win") {
      tempWin++;
      if (tempWin > bestWinStreak) bestWinStreak = tempWin;
    } else {
      tempWin = 0;
    }
  }

  return {
    totalPicks: picks.length,
    wins,
    losses,
    pushes,
    winPct,
    currentStreak:
      currentStreakType && currentStreak > 0
        ? `${currentStreak}${currentStreakType}`
        : "-",
    bestWinStreak,
  };
}

function getStatsGlow(winPct: string) {
  const pct = Number(winPct);

  if (pct >= 55) {
    return "shadow-[0_0_30px_rgba(34,197,94,0.18)]";
  }

  if (pct <= 45 && pct > 0) {
    return "shadow-[0_0_30px_rgba(252,165,165,0.16)]";
  }

  return "shadow-[0_0_20px_rgba(129,140,248,0.08)]";
}

function SportStatCard({
  title,
  stats,
}: {
  title: string;
  stats: ReturnType<typeof calculateStats>;
}) {
  return (
    <div className="rounded-2xl border border-[#2f2949] bg-[#100d19] p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-[#9f96c7]">
        {title}
      </div>

      <div className="mt-3 text-xl font-bold">
        <span className="text-green-400">{stats.wins}</span>
        <span className="mx-1 text-zinc-500">-</span>
        <span className="text-red-300">{stats.losses}</span>
        <span className="mx-1 text-zinc-500">-</span>
        <span className="text-amber-300">{stats.pushes}</span>
      </div>

      <div className="mt-1 text-sm text-[#c7c3da]">{stats.winPct}% win rate</div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-[#9f96c7]">Picks</div>
          <div className="mt-1 font-semibold">{stats.totalPicks}</div>
        </div>

        <div>
          <div className="text-[#9f96c7]">Current</div>
          <div className="mt-1 font-semibold">{stats.currentStreak}</div>
        </div>

        <div>
          <div className="text-[#9f96c7]">Best Win</div>
          <div className="mt-1 font-semibold">{stats.bestWinStreak}</div>
        </div>

        <div>
          <div className="text-[#9f96c7]">Win %</div>
          <div className="mt-1 font-semibold">{stats.winPct}%</div>
        </div>
      </div>
    </div>
  );
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !(session.user as any).appUserId) {
    redirect("/login");
  }

  const appUserId = (session.user as any).appUserId as string;
  const provider = (session.user as any).provider as string | undefined;

  const [
    { data: linkedAccounts, error: linkedAccountsError },
    { data: picks, error: picksError },
  ] = await Promise.all([
    supabase
      .from("user_accounts")
      .select("provider, email")
      .eq("user_id", appUserId),
    supabase
      .from("picks")
      .select("*")
      .eq("user_id", appUserId)
      .order("created_at", { ascending: false }),
  ]);

  if (linkedAccountsError) {
    throw new Error(linkedAccountsError.message);
  }

  if (picksError) {
    throw new Error(picksError.message);
  }

  const linkedAccountsData = (linkedAccounts ?? []) as LinkedAccountRow[];
  const userPicks = ((picks ?? []) as PickRow[]).map((pick) => ({
    ...pick,
    sport: pick.sport || "nba",
  }));

  const overallStats = calculateStats(userPicks);
  const nbaStats = calculateStats(
    userPicks.filter((pick) => !pick.sport || pick.sport === "nba")
  );
  const soccerStats = calculateStats(
    userPicks.filter((pick) => pick.sport === "soccer")
  );

  const displayName = session.user.name || userPicks[0]?.user_name || "User";
  const displayImage = session.user.image || userPicks[0]?.user_image || null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#1a1333_0%,_#0d0a19_45%,_#05030b_100%)] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-3xl font-bold">My Profile</h1>

        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <div
            className={`rounded-3xl border border-[#31294c] bg-[linear-gradient(180deg,#131021,#0b0914)] p-6 transition-all duration-300 ${getStatsGlow(
              overallStats.winPct
            )}`}
          >
            <div className="flex flex-col items-center text-center">
              {displayImage ? (
                <Image
                  src={displayImage}
                  alt={displayName}
                  width={104}
                  height={104}
                  className="rounded-full border border-[#31294c] shadow-[0_0_25px_rgba(99,102,241,0.15)]"
                  unoptimized
                />
              ) : (
                <div className="flex h-26 w-26 items-center justify-center rounded-full border border-[#31294c] bg-[#1a1630] text-3xl font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}

              <h2 className="mt-4 text-2xl font-semibold">{displayName}</h2>
              <p className="mt-1 text-sm text-[#9f96c7]">
                {provider === "discord"
                  ? "Signed in with Discord"
                  : provider === "twitch"
                  ? "Signed in with Twitch"
                  : "Connected account"}
              </p>

              <div className="mt-5 w-full rounded-2xl border border-[#31294c] bg-[#110f1b] px-4 py-4 text-center">
                <div className="text-xs uppercase tracking-[0.2em] text-[#9f96c7]">
                  Overall Record
                </div>
                <div className="mt-2 text-2xl font-bold">
                  <span className="text-green-400">{overallStats.wins}</span>
                  <span className="mx-1 text-zinc-500">-</span>
                  <span className="text-red-300">{overallStats.losses}</span>
                  <span className="mx-1 text-zinc-500">-</span>
                  <span className="text-amber-300">{overallStats.pushes}</span>
                </div>
                <div className="mt-1 text-sm text-[#c7c3da]">
                  {overallStats.winPct}% win rate
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <SportStatCard title="NBA Record" stats={nbaStats} />
              <SportStatCard title="Soccer Record" stats={soccerStats} />
            </div>

            <LinkAccountsCard accounts={linkedAccountsData} />
          </div>

          <PickHistoryTabs picks={userPicks} />
        </div>
      </div>
    </main>
  );
}