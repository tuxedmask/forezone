import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import LinkAccountsCard from "./LinkAccountsCard";
import WeeklyPredictionHistory, {
  WeeklyEntryWithPicks,
} from "./WeeklyPredictionHistory";

type LinkedAccountRow = {
  provider: "discord" | "twitch";
  email: string | null;
};

type SoccerEntryRow = {
  id: string;
  user_id: string;
  league_slug: string | null;
  matchweek_label: string | null;
  status: string | null;
  created_at: string | null;
  submitted_at: string | null;
  total_points: number | null;
  graded: boolean | null;
};

type SoccerPredictionPickRow = {
  id: string;
  entry_id: string;
  match_id: string | null;
  home_team: string | null;
  away_team: string | null;
  predicted_home_score: number | null;
  predicted_away_score: number | null;
  actual_home_score: number | null;
  actual_away_score: number | null;
  points: number | null;
  correct_score_points: number | null;
  graded: boolean | null;
  home_logo?: string | null;
  away_logo?: string | null;
  kickoff_time?: string | null;
};

function getLeagueLabel(slug: string | null) {
  switch (slug) {
    case "premier-league":
      return "Premier League";
    case "bundesliga":
      return "Bundesliga";
    case "mls":
      return "MLS";
    case "la-liga":
      return "La Liga";
    case "serie-a":
      return "Serie A";
    default:
      return slug || "League";
  }
}

function getWeekNumber(label: string | null) {
  if (!label) return 0;
  const match = label.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function getProfileGlow(totalPoints: number) {
  if (totalPoints >= 100) {
    return "shadow-[0_0_0_1px_rgba(74,222,128,0.10),0_0_35px_rgba(34,197,94,0.14)]";
  }

  if (totalPoints === 0) {
    return "shadow-[0_0_0_1px_rgba(165,180,252,0.08),0_0_22px_rgba(99,102,241,0.08)]";
  }

  return "shadow-[0_0_0_1px_rgba(165,180,252,0.10),0_0_28px_rgba(99,102,241,0.12)]";
}

function calculateEntryStats(
  entries: SoccerEntryRow[],
  picks: SoccerPredictionPickRow[]
) {
  const totalEntries = entries.length;
  const gradedEntries = entries.filter((entry) => entry.graded).length;
  const pendingEntries = totalEntries - gradedEntries;

  const totalPoints = entries.reduce(
    (sum, entry) => sum + Number(entry.total_points || 0),
    0
  );

  let bestWeekPoints = 0;
  let bestWeekLabel = "-";

  for (const entry of entries) {
    const points = Number(entry.total_points || 0);
    if (points > bestWeekPoints) {
      bestWeekPoints = points;
      bestWeekLabel = entry.matchweek_label || "-";
    }
  }

  const averagePoints =
    gradedEntries > 0 ? totalPoints / gradedEntries : 0;

  const correctScores = picks.filter(
    (pick) => Number(pick.correct_score_points || 0) > 0
  ).length;

  return {
    totalEntries,
    gradedEntries,
    pendingEntries,
    totalPoints,
    bestWeekPoints,
    bestWeekLabel,
    averagePoints,
    correctScores,
  };
}

function SummaryCard({
  label,
  value,
  subValue,
  accent = "text-indigo-300",
}: {
  label: string;
  value: string;
  subValue?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#31294c] bg-[linear-gradient(180deg,#151125,#0d0a17)] p-4 shadow-[0_0_18px_rgba(0,0,0,0.12)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9f96c7]">
        {label}
      </div>
      <div className={`mt-3 text-2xl font-black tracking-tight ${accent}`}>
        {value}
      </div>
      {subValue ? (
        <div className="mt-1.5 text-sm text-[#c7c3da]">{subValue}</div>
      ) : null}
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
    { data: entries, error: entriesError },
  ] = await Promise.all([
    supabase
      .from("user_accounts")
      .select("provider, email")
      .eq("user_id", appUserId),
    supabase
      .from("soccer_prediction_entries")
      .select("*")
      .eq("user_id", appUserId)
      .order("created_at", { ascending: false }),
  ]);

  if (linkedAccountsError) {
    throw new Error(linkedAccountsError.message);
  }

  if (entriesError) {
    throw new Error(entriesError.message);
  }

  const linkedAccountsData = (linkedAccounts ?? []) as LinkedAccountRow[];
  const soccerEntries = (entries ?? []) as SoccerEntryRow[];
  const entryIds = soccerEntries.map((entry) => entry.id);

  let entryPicks: SoccerPredictionPickRow[] = [];

  if (entryIds.length > 0) {
    const { data: picks, error: picksError } = await supabase
      .from("soccer_prediction_picks")
      .select("*")
      .in("entry_id", entryIds);

    if (picksError) {
      throw new Error(picksError.message);
    }

    entryPicks = (picks ?? []) as SoccerPredictionPickRow[];
  }

  const matchCache: Record<
    string,
    {
      home_logo: string | null;
      away_logo: string | null;
      kickoff_time: string | null;
    }
  > = {};

  for (const entry of soccerEntries) {
    const leagueSlug = entry.league_slug;
    const matchweekLabel = entry.matchweek_label;

    if (!leagueSlug || !matchweekLabel) continue;

    const weekMatch = matchweekLabel.match(/\d+/);
    if (!weekMatch) continue;

    const matchweek = weekMatch[0];

    try {
      const headerStore = await headers();
const host = headerStore.get("host");
const protocol = host?.includes("localhost") ? "http" : "https";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.VERCEL_URL?.replace(/^https?:\/\//, "")
    ? `${protocol}://${process.env.VERCEL_URL?.replace(/^https?:\/\//, "")}`
    : host
    ? `${protocol}://${host}`
    : "http://localhost:3000";

const res = await fetch(
  `${baseUrl}/api/soccer/predictions/${leagueSlug}/matchweek?matchweek=${matchweek}`,
  { cache: "no-store" }
);

      if (!res.ok) continue;

      const data = await res.json();
      const matches = data?.matches || [];

      for (const match of matches) {
        matchCache[String(match.id)] = {
          home_logo: match.homeLogo || null,
          away_logo: match.awayLogo || null,
          kickoff_time: match.kickoff || null,
        };
      }
    } catch {
      // ignore match enrichment failures
    }
  }

  entryPicks = entryPicks.map((pick) => {
    const matchData = matchCache[String(pick.match_id)] || {
      home_logo: null,
      away_logo: null,
      kickoff_time: null,
    };

    return {
      ...pick,
      home_logo: matchData.home_logo,
      away_logo: matchData.away_logo,
      kickoff_time: matchData.kickoff_time,
    };
  });

  const picksByEntry: Record<string, SoccerPredictionPickRow[]> = {};

  for (const pick of entryPicks) {
    if (!picksByEntry[pick.entry_id]) {
      picksByEntry[pick.entry_id] = [];
    }
    picksByEntry[pick.entry_id].push(pick);
  }

  const weeklyEntries: WeeklyEntryWithPicks[] = soccerEntries
    .map((entry) => ({
      id: entry.id,
      leagueLabel: getLeagueLabel(entry.league_slug),
      leagueSlug: entry.league_slug,
      matchweekLabel: entry.matchweek_label,
      status: entry.status,
      createdAt: entry.created_at,
      submittedAt: entry.submitted_at,
      totalPoints: Number(entry.total_points || 0),
      graded: Boolean(entry.graded),
      picks: (picksByEntry[entry.id] || []).sort((a, b) => {
        const aTime = a.kickoff_time ? Date.parse(a.kickoff_time) : Number.MAX_SAFE_INTEGER;
        const bTime = b.kickoff_time ? Date.parse(b.kickoff_time) : Number.MAX_SAFE_INTEGER;

        if (aTime !== bTime) return aTime - bTime;

        return String(a.home_team || "").localeCompare(String(b.home_team || ""));
      }),
    }))
    .sort((a, b) => getWeekNumber(a.matchweekLabel) - getWeekNumber(b.matchweekLabel));

  const stats = calculateEntryStats(soccerEntries, entryPicks);

  const displayName = session.user.name || "User";
  const displayImage = session.user.image || null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#1a1333_0%,_#0d0a19_45%,_#05030b_100%)] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-3xl font-bold">Your Zone</h1>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div
            className={`rounded-[28px] border border-[#31294c] bg-[linear-gradient(180deg,#151125,#0d0a17)] p-6 transition-all duration-300 ${getProfileGlow(
              stats.totalPoints
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

              <div className="mt-5 w-full rounded-2xl border border-[#31294c] bg-[linear-gradient(180deg,#120f1d,#0e0b18)] px-4 py-5 text-center shadow-[0_0_18px_rgba(0,0,0,0.12)]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9f96c7]">
                  Soccer Prediction Summary
                </div>
                <div className="mt-2 text-4xl font-black tracking-tight text-indigo-300">
                  {stats.totalPoints.toFixed(2)}
                </div>
                <div className="mt-1.5 text-sm text-[#c7c3da]">
                  Total points across all matchweeks
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <SummaryCard
                label="Entries"
                value={String(stats.totalEntries)}
                subValue={`${stats.gradedEntries} graded / ${stats.pendingEntries} pending`}
                accent="text-white"
              />

              <SummaryCard
                label="Best Week"
                value={stats.bestWeekLabel}
                subValue={`${stats.bestWeekPoints.toFixed(2)} pts`}
                accent="text-indigo-300"
              />

              <SummaryCard
                label="Correct Scores"
                value={String(stats.correctScores)}
                subValue="Exact score hits across all matchweeks"
                accent="text-emerald-300"
              />

              <SummaryCard
                label="Avg. Graded Week"
                value={stats.averagePoints.toFixed(2)}
                accent="text-cyan-300"
              />
            </div>

            <div className="mt-6 rounded-2xl border border-[#31294c] bg-[linear-gradient(180deg,#120f1d,#0e0b18)] p-4 shadow-[0_0_18px_rgba(0,0,0,0.12)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9f96c7]">
                Current Focus
              </div>
              <div className="mt-3 text-lg font-semibold text-white">
                Soccer predictions
              </div>
              <p className="mt-2 text-sm text-[#c7c3da]">
                Weekly score predictions, points, and graded results are the
                main focus right now.
              </p>
            </div>

            <LinkAccountsCard accounts={linkedAccountsData} />
          </div>

          <WeeklyPredictionHistory entries={weeklyEntries} />
        </div>
      </div>
    </main>
  );
}