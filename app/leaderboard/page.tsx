"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type LeaderboardRow = {
  userId: string;
  userName: string;
  userImage: string | null;
  wins: number;
  losses: number;
  pending: number;
  total: number;
  units: number;
  winPct: string;
};

type RangeType = "weekly" | "monthly" | "all";

function getRangeLabel(range: RangeType) {
  if (range === "weekly") return "Weekly";
  if (range === "monthly") return "Monthly";
  return "All Time";
}

function getCurrentMonthString() {
  return new Date().toISOString().slice(0, 7);
}

function getStartOfWeekString() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

function getRankDisplay(index: number) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `#${index + 1}`;
}

function getRowStyles(index: number) {
  if (index === 0) {
    return {
      background: "rgba(255,215,0,0.10)",
      border: "1px solid rgba(255,215,0,0.35)",
      boxShadow: "0 0 16px rgba(255,215,0,0.18)",
    };
  }

  if (index === 1) {
    return {
      background: "rgba(192,192,192,0.08)",
      border: "1px solid rgba(192,192,192,0.30)",
      boxShadow: "0 0 12px rgba(192,192,192,0.12)",
    };
  }

  if (index === 2) {
    return {
      background: "rgba(205,127,50,0.10)",
      border: "1px solid rgba(205,127,50,0.30)",
      boxShadow: "0 0 12px rgba(205,127,50,0.14)",
    };
  }

  return {
    background: "#110f1b",
    border: "1px solid #221c36",
  };
}

function PodiumCard({
  row,
  place,
}: {
  row: LeaderboardRow;
  place: 1 | 2 | 3;
}) {
  const medal = place === 1 ? "👑" : place === 2 ? "🥈" : "🥉";

  const pillarHeight = place === 1 ? 200 : place === 2 ? 150 : 110;

  const color =
    place === 1 ? "#ffd700" : place === 2 ? "#e5e7eb" : "#cd7f32";

  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div
        style={{
          borderRadius: 20,
          padding: 18,
          textAlign: "center",
          background: "#131021",
          border: "1px solid #2a2344",
          marginBottom: 10,
        }}
      >
        <div style={{ fontSize: 26 }}>{medal}</div>

        {row.userImage ? (
          <Image
            src={row.userImage}
            alt={row.userName}
            width={64}
            height={64}
            unoptimized
            style={{ borderRadius: "999px", margin: "10px auto" }}
          />
        ) : (
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "999px",
              background: "#1a1630",
              margin: "10px auto",
            }}
          />
        )}

        <div style={{ fontWeight: 800 }}>{row.userName}</div>

        <div style={{ color: "#9f96c7", fontSize: 13 }}>
          {row.wins}-{row.losses} • {row.winPct}%
        </div>

        <div style={{ fontWeight: 900, fontSize: 22, marginTop: 6 }}>
          {row.units >= 0 ? "+" : ""}
          {row.units}u
        </div>
      </div>

      <div
        style={{
          height: pillarHeight,
          background:
            place === 1
              ? "linear-gradient(#ffd700,#eab308)"
              : place === 2
              ? "linear-gradient(#d1d5db,#9ca3af)"
              : "linear-gradient(#cd7f32,#92400e)",
          borderRadius: "14px 14px 0 0",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          paddingTop: 12,
          fontWeight: 900,
          fontSize: 26,
          color: "#111",
        }}
      >
        {place}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeType>("all");
  const [selectedWeek, setSelectedWeek] = useState(getStartOfWeekString());
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());

  useEffect(() => {
    let mounted = true;

    async function loadLeaderboard() {
      let url = "/api/leaderboard?range=all";

      if (range === "weekly") {
        url = `/api/leaderboard?range=weekly&week=${selectedWeek}`;
      }

      if (range === "monthly") {
        url = `/api/leaderboard?range=monthly&month=${selectedMonth}`;
      }

      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();

      if (!mounted) return;

      setRows(data || []);
      setLoading(false);
    }

    loadLeaderboard();

    const interval = setInterval(loadLeaderboard, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [range, selectedWeek, selectedMonth]);

  const podium = useMemo(() => rows.slice(0, 3), [rows]);
  const rest = useMemo(() => rows.slice(3), [rows]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #1a1333 0%, #0d0a19 45%, #05030b 100%)",
        color: "white",
        fontFamily: "Arial",
      }}
    >
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "56px 24px" }}>
        <h1 style={{ fontSize: 44 }}>Leaderboard</h1>

        <p style={{ color: "#c7c3da", marginBottom: 20 }}>
          {getRangeLabel(range)} rankings by units won
        </p>

        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {(["weekly", "monthly", "all"] as RangeType[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: "10px 16px",
                borderRadius: 999,
                border: "1px solid #31294c",
                background: range === r ? "#31294c" : "#120f1e",
                color: "white",
                cursor: "pointer",
              }}
            >
              {getRangeLabel(r)}
            </button>
          ))}
        </div>

        {podium.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.2fr 1fr",
              gap: 20,
              alignItems: "end",
              marginBottom: 40,
            }}
          >
            {podium[1] && <PodiumCard row={podium[1]} place={2} />}
            {podium[0] && <PodiumCard row={podium[0]} place={1} />}
            {podium[2] && <PodiumCard row={podium[2]} place={3} />}
          </div>
        )}

        {rest.map((row, index) => {
          const i = index + 3;
          const style = getRowStyles(i);

          return (
            <div
              key={row.userId}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "80px minmax(220px,1.5fr) repeat(4,90px)",
                alignItems: "center",
                padding: 16,
                marginBottom: 10,
                borderRadius: 14,
                ...style,
              }}
            >
              <div>{getRankDisplay(i)}</div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {row.userImage ? (
                  <Image
                    src={row.userImage}
                    alt={row.userName}
                    width={40}
                    height={40}
                    unoptimized
                    style={{ borderRadius: "999px" }}
                  />
                ) : (
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "999px",
                      background: "#1a1630",
                    }}
                  />
                )}

                <div>{row.userName}</div>
              </div>

              <div>{row.wins}-{row.losses}</div>
              <div>{row.winPct}%</div>
              <div>{row.pending}</div>
              <div>{row.units >= 0 ? "+" : ""}{row.units}</div>
            </div>
          );
        })}
      </section>
    </main>
  );
}