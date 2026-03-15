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

  return (
    <div
      style={{
        borderRadius: 20,
        padding: 20,
        textAlign: "center",
        background: "#131021",
        border: "1px solid #2a2344",
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 10 }}>{medal}</div>

      {row.userImage ? (
        <Image
          src={row.userImage}
          alt={row.userName}
          width={70}
          height={70}
          unoptimized
          style={{
            borderRadius: "999px",
            objectFit: "cover",
            marginBottom: 10,
          }}
        />
      ) : (
        <div
          style={{
            width: 70,
            height: 70,
            borderRadius: "999px",
            background: "#1a1630",
            margin: "0 auto 10px",
          }}
        />
      )}

      <div style={{ fontWeight: 700 }}>{row.userName}</div>

      <div style={{ fontSize: 14, color: "#9f96c7", marginTop: 6 }}>
        {row.wins}-{row.losses} • {row.winPct}%
      </div>

      <div
        style={{
          fontWeight: 800,
          fontSize: 22,
          marginTop: 8,
        }}
      >
        {row.units >= 0 ? "+" : ""}
        {row.units}u
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
      try {
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
      } finally {
        setLoading(false);
      }
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
      <section
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "56px 24px 80px",
        }}
      >
        <h1 style={{ fontSize: 44 }}>Leaderboard</h1>

        <p style={{ color: "#c7c3da", marginBottom: 20 }}>
          {getRangeLabel(range)} rankings by units won.
        </p>

        {/* Range Buttons */}
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

        {/* Podium */}
        {podium.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 20,
              marginBottom: 30,
            }}
          >
            {podium.map((row, i) => (
              <PodiumCard key={row.userId} row={row} place={(i + 1) as 1 | 2 | 3} />
            ))}
          </div>
        )}

        {/* Remaining leaderboard */}
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