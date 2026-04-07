"use client";

import { useEffect, useMemo, useState } from "react";

type Match = {
  id: number;
  home: string;
  away: string;
  kickoff: string;
  homeLogo: string;
  awayLogo: string;
};

type OddsRow = {
  match_id: string;
  home_team: string;
  away_team: string;
  kickoff: string;

  home_win_odds: string;
  draw_odds: string;
  away_win_odds: string;

  over_2_5_odds: string;
  under_2_5_odds: string;

  btts_yes_odds: string;
  btts_no_odds: string;

  odds_locked: boolean;
};

type MatchweekOption = {
  value: string;
  label: string;
};

type MatchweekResponse = {
  leagueSlug: string;
  leagueName: string;
  matchweekLabel: string | null;
  matchday: number | null;
  matches: Array<
    Match & {
      home_win_odds?: number | null;
      draw_odds?: number | null;
      away_win_odds?: number | null;
      over_2_5_odds?: number | null;
      under_2_5_odds?: number | null;
      btts_yes_odds?: number | null;
      btts_no_odds?: number | null;
    }
  >;
  availableMatchweeks?: MatchweekOption[] | string[];
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function getShortTeamName(name: string) {
  const map: Record<string, string> = {
    "West Ham United": "West Ham",
    "West Ham United FC": "West Ham",
    "Wolverhampton Wanderers": "Wolves",
    "Wolverhampton Wanderers FC": "Wolves",
    Wolverhampton: "Wolves",
    "AFC Bournemouth": "Bournemouth",
    "Brighton & Hove Albion": "Brighton",
    "Brighton and Hove Albion": "Brighton",
    "Brighton Hove": "Brighton",
    "Tottenham Hotspur": "Tottenham",
    "Tottenham Hotspur FC": "Tottenham",
    "Newcastle United": "Newcastle",
    "Newcastle United FC": "Newcastle",
    "Manchester United": "Man United",
    "Manchester United FC": "Man United",
    "Manchester City": "Man City",
    "Manchester City FC": "Man City",
    "Nottingham Forest": "Nottingham Forest",
    Nottingham: "Nottingham Forest",
    "Leicester City": "Leicester",
    "Ipswich Town": "Ipswich",
    "Crystal Palace": "Palace",
    "West Bromwich Albion": "West Brom",
  };

  return map[name] || name;
}

function normalizeMatchweekOptions(
  availableMatchweeks: MatchweekResponse["availableMatchweeks"],
  currentLabel: string | null
) {
  const normalized: MatchweekOption[] = [];

  if (Array.isArray(availableMatchweeks)) {
    for (const item of availableMatchweeks) {
      if (typeof item === "string") {
        normalized.push({ value: item, label: item });
      } else if (item?.value && item?.label) {
        normalized.push(item);
      }
    }
  }

  if (
    currentLabel &&
    !normalized.some((option) => option.value === currentLabel)
  ) {
    normalized.unshift({
      value: currentLabel,
      label: currentLabel,
    });
  }

  return normalized;
}

function formatKickoff(isoString: string) {
  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) return isoString;

  return new Intl.DateTimeFormat("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Toronto",
  }).format(date);
}

function shouldBeLocked(kickoff: string) {
  const ts = new Date(kickoff).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() >= ts - 5 * 60 * 1000;
}

function toInputValue(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function TeamBadge({
  name,
  logo,
  compact = false,
}: {
  name: string;
  logo: string;
  compact?: boolean;
}) {
  const [broken, setBroken] = useState(false);

  const outerSize = compact
    ? "h-10 w-10 rounded-[16px]"
    : "h-24 w-24 rounded-[26px]";
  const innerSize = compact ? "h-7 w-7" : "h-16 w-16";
  const textSize = compact ? "text-sm" : "text-xl";
  const padding = compact ? "p-1.5" : "p-3";

  if (!logo || broken) {
    return (
      <div
        className={`flex ${outerSize} items-center justify-center border border-white/10 bg-gradient-to-br from-white/15 to-white/5 ${textSize} font-black text-white shadow-[0_12px_32px_rgba(0,0,0,0.4)]`}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <div
      className={`relative flex ${outerSize} items-center justify-center border border-white/10 bg-gradient-to-br from-white/15 to-white/5 ${padding} shadow-[0_12px_32px_rgba(0,0,0,0.4)]`}
    >
      <img
        src={logo}
        alt={name}
        className={`${innerSize} object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,0.65)]`}
        onError={() => setBroken(true)}
      />
    </div>
  );
}

function OddsInput({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <input
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      inputMode="decimal"
      placeholder="-"
      className={`w-full rounded-xl border px-3 py-3 text-center text-sm font-semibold outline-none transition ${
        disabled
          ? "cursor-not-allowed border-white/10 bg-black/40 text-white/40"
          : "border-white/10 bg-black/50 text-white hover:border-white/15 focus:border-cyan-400/35 focus:bg-black/65"
      }`}
    />
  );
}

function OddsGroup({
  title,
  accent,
  fields,
}: {
  title: string;
  accent: string;
  fields: Array<{
    label: string;
    value: string;
    disabled: boolean;
    onChange: (value: string) => void;
  }>;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className={`text-xs font-semibold uppercase tracking-[0.16em] ${accent}`}>
        {title}
      </div>

      <div
        className={`mt-4 grid gap-3 ${
          fields.length === 3 ? "grid-cols-3" : "grid-cols-2"
        }`}
      >
        {fields.map((field) => (
          <label key={field.label} className="text-sm">
            <div className="mb-2 text-center text-white/60">{field.label}</div>
            <OddsInput
              value={field.value}
              disabled={field.disabled}
              onChange={field.onChange}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function MatchOddsCard({
  match,
  row,
  leagueName,
  onChange,
}: {
  match: Match;
  row: OddsRow;
  leagueName: string;
  onChange: (field: keyof OddsRow, value: string) => void;
}) {
  const locked = row.odds_locked || shouldBeLocked(row.kickoff);
  const homeShort = getShortTeamName(match.home);
  const awayShort = getShortTeamName(match.away);

  return (
    <div
      className={`relative overflow-hidden rounded-[26px] border p-4 backdrop-blur-xl transition ${
        locked
          ? "border-amber-400/20 bg-amber-500/5"
          : "border-white/10 bg-white/5 hover:border-emerald-400/20 hover:bg-white/[0.07]"
      }`}
    >
      <div className="text-center">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200">
          {leagueName}
        </div>
        <div className="mt-1.5 text-sm text-white/55">
          {formatKickoff(match.kickoff)}
        </div>

        <div className="mt-2 inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold">
          {locked ? (
            <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-amber-200">
              Locked
            </span>
          ) : (
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-emerald-200">
              Editable
            </span>
          )}
        </div>
      </div>

      <div className="relative mt-4 rounded-[24px] border border-white/10 bg-black/20 px-4 py-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2">
          <div className="flex min-w-0 flex-col items-center text-center">
            <TeamBadge name={match.home} logo={match.homeLogo} />
            <div className="mt-3 text-xs uppercase tracking-[0.18em] text-white/35">
              Home
            </div>
            <div className="mt-1.5 w-full max-w-[140px] text-center text-[1.05rem] font-extrabold leading-tight text-white whitespace-normal break-normal">
              {homeShort}
            </div>
          </div>

          <div className="flex items-center justify-center pt-6">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold tracking-[0.28em] text-white/45">
              VS
            </div>
          </div>

          <div className="flex min-w-0 flex-col items-center text-center">
            <TeamBadge name={match.away} logo={match.awayLogo} />
            <div className="mt-3 text-xs uppercase tracking-[0.18em] text-white/35">
              Away
            </div>
            <div className="mt-1.5 w-full max-w-[140px] text-center text-[1.05rem] font-extrabold leading-tight text-white whitespace-normal break-normal">
              {awayShort}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <OddsGroup
            title="1X2"
            accent="text-cyan-200"
            fields={[
              {
                label: "Home",
                value: row.home_win_odds,
                disabled: locked,
                onChange: (value) => onChange("home_win_odds", value),
              },
              {
                label: "Draw",
                value: row.draw_odds,
                disabled: locked,
                onChange: (value) => onChange("draw_odds", value),
              },
              {
                label: "Away",
                value: row.away_win_odds,
                disabled: locked,
                onChange: (value) => onChange("away_win_odds", value),
              },
            ]}
          />

          <OddsGroup
            title="O/U 2.5"
            accent="text-indigo-200"
            fields={[
              {
                label: "Over",
                value: row.over_2_5_odds,
                disabled: locked,
                onChange: (value) => onChange("over_2_5_odds", value),
              },
              {
                label: "Under",
                value: row.under_2_5_odds,
                disabled: locked,
                onChange: (value) => onChange("under_2_5_odds", value),
              },
            ]}
          />

          <OddsGroup
            title="BTTS"
            accent="text-emerald-200"
            fields={[
              {
                label: "Yes",
                value: row.btts_yes_odds,
                disabled: locked,
                onChange: (value) => onChange("btts_yes_odds", value),
              },
              {
                label: "No",
                value: row.btts_no_odds,
                disabled: locked,
                onChange: (value) => onChange("btts_no_odds", value),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminSoccerOddsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [rows, setRows] = useState<Record<string, OddsRow>>({});

  const [leagueName, setLeagueName] = useState("Premier League");
  const [matchweekLabel, setMatchweekLabel] = useState<string | null>(null);
  const [selectedMatchweek, setSelectedMatchweek] = useState("");
  const [availableMatchweeks, setAvailableMatchweeks] = useState<MatchweekOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPage() {
      try {
        setLoading(true);
        setError("");
        setMessage("");

        const params = new URLSearchParams();
        if (selectedMatchweek) {
          params.set("matchweek", selectedMatchweek);
        }

        const query = params.toString();

        const matchweekRes = await fetch(
          `/api/soccer/predictions/premier-league/matchweek${query ? `?${query}` : ""}`,
          { cache: "no-store" }
        );
        const matchweekData: MatchweekResponse & { error?: string } =
          await matchweekRes.json();

        if (!matchweekRes.ok) {
          throw new Error(matchweekData?.error || "Failed to load matches");
        }

        const liveMatches = Array.isArray(matchweekData?.matches)
          ? matchweekData.matches
          : [];

        const nextLabel = matchweekData.matchweekLabel || null;
        const normalizedOptions = normalizeMatchweekOptions(
          matchweekData.availableMatchweeks,
          nextLabel
        );

        setMatches(liveMatches);
        setLeagueName(matchweekData.leagueName || "Premier League");
        setMatchweekLabel(nextLabel);
        setAvailableMatchweeks(normalizedOptions);

        if (!selectedMatchweek && nextLabel) {
          setSelectedMatchweek(nextLabel);
        }

        const initialRows: Record<string, OddsRow> = {};
        for (const match of liveMatches) {
          initialRows[String(match.id)] = {
            match_id: String(match.id),
            home_team: match.home,
            away_team: match.away,
            kickoff: match.kickoff,

            home_win_odds: toInputValue(match.home_win_odds),
            draw_odds: toInputValue(match.draw_odds),
            away_win_odds: toInputValue(match.away_win_odds),

            over_2_5_odds: toInputValue(match.over_2_5_odds),
            under_2_5_odds: toInputValue(match.under_2_5_odds),

            btts_yes_odds: toInputValue(match.btts_yes_odds),
            btts_no_odds: toInputValue(match.btts_no_odds),

            odds_locked: shouldBeLocked(match.kickoff),
          };
        }

        setRows(initialRows);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load page");
        setMatches([]);
        setRows({});
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [selectedMatchweek]);

  const orderedRows = useMemo(() => {
    return matches
      .map((match) => ({
        match,
        row: rows[String(match.id)],
      }))
      .filter((item) => Boolean(item.row));
  }, [matches, rows]);

  function updateRow(matchId: string, field: keyof OddsRow, value: string) {
    setRows((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: value,
      },
    }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = orderedRows.map(({ row }) => ({
        ...row,
        odds_locked: row.odds_locked || shouldBeLocked(row.kickoff),
      }));

      const res = await fetch("/api/admin/soccer-odds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rows: payload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to save odds");
      }

      setMessage("Odds saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save odds");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#05070f] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
            Admin • Soccer Odds
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-tight">
            Odds Control Center
          </h1>

          <p className="mt-3 max-w-2xl text-white/65">
            Same look as the pick page, but built for odds entry. Select the
            league and matchweek, then set 1X2, O/U 2.5, and BTTS odds for each
            match.
          </p>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  League
                </div>
                <div className="mt-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-semibold text-white">
                  {leagueName}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                  Matchweek
                </div>

                <select
                  value={selectedMatchweek}
                  onChange={(e) => setSelectedMatchweek(e.target.value)}
                  className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-semibold text-white outline-none transition hover:border-white/15 focus:border-cyan-400/35"
                >
                  {availableMatchweeks.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="bg-[#0b1020] text-white"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-stretch">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading || orderedRows.length === 0}
              className="w-full rounded-[24px] border border-emerald-400/25 bg-emerald-500/15 px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
            >
              {saving ? "Saving..." : "Save Odds"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/70">
            Loading matches...
          </div>
        ) : null}

        {error ? (
          <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {message}
          </div>
        ) : null}

        {!loading && orderedRows.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/70">
            No scheduled matches found for this matchweek.
          </div>
        ) : null}

        {!loading ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {orderedRows.map(({ match, row }) => (
              <MatchOddsCard
                key={row.match_id}
                match={match}
                row={row}
                leagueName={leagueName}
                onChange={(field, value) => updateRow(row.match_id, field, value)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}