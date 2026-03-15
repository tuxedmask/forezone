"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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

function getRankDisplay(index: number) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `#${index + 1}`;
}

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

function getTopRowStyles(index: number) {
  if (index === 0) {
    return {
      background:
        "linear-gradient(120deg, rgba(255,215,0,0.28), rgba(255,255,255,0.05), rgba(255,215,0,0.18))",
      border: "1px solid rgba(255,215,0,0.65)",
      boxShadow:
        "0 0 35px rgba(255,215,0,0.45), inset 0 0 18px rgba(255,215,0,0.18)",
    };
  }

  if (index === 1) {
    return {
      background:
        "linear-gradient(180deg, rgba(192,192,192,0.18), rgba(255,255,255,0.02))",
      border: "1px solid rgba(192,192,192,0.55)",
      boxShadow:
        "0 0 22px rgba(192,192,192,0.35), inset 0 0 14px rgba(192,192,192,0.12)",
    };
  }

  if (index === 2) {
    return {
      background:
        "linear-gradient(180deg, rgba(205,127,50,0.22), rgba(255,255,255,0.02))",
      border: "1px solid rgba(205,127,50,0.60)",
      boxShadow:
        "0 0 22px rgba(205,127,50,0.40), inset 0 0 14px rgba(205,127,50,0.12)",
    };
  }

  return {
    background: "#110f1b",
    border: "1px solid #221c36",
    boxShadow: "none",
  };
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState<RangeType>("all");
  const [selectedWeek, setSelectedWeek] = useState(getStartOfWeekString());
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());

  useEffect(() => {
    let mounted = true;

    async function loadLeaderboard(initial = false) {
      try {
        if (initial) setLoading(true);

        let url = "/api/leaderboard?range=all";

        if (range === "weekly") {
          url = `/api/leaderboard?range=weekly&week=${selectedWeek}`;
        } else if (range === "monthly") {
          url = `/api/leaderboard?range=monthly&month=${selectedMonth}`;
        }

        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        if (!mounted) return;

        setRows(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (!mounted) return;
        setError(err.message);
      } finally {
        if (initial) setLoading(false);
      }
    }

    loadLeaderboard(true);

    const interval = setInterval(() => {
      loadLeaderboard(false);
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [range, selectedWeek, selectedMonth]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #1a1333 0%, #0d0a19 45%, #05030b 100%)",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          padding: "56px 24px 80px",
        }}
      >
        <p style={{ color: "#9f96c7", fontSize: 12, marginBottom: 12 }}>
          Rankings
        </p>

        <h1 style={{ fontSize: "44px", marginBottom: 12 }}>Leaderboard</h1>

        <p style={{ color: "#c7c3da", marginBottom: 24 }}>
          {getRangeLabel(range)} rankings by units won.
        </p>

        {/* Range Buttons */}
        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          {(["weekly", "monthly", "all"] as RangeType[]).map((option) => (
            <button
              key={option}
              onClick={() => setRange(option)}
              style={{
                padding: "10px 16px",
                borderRadius: 999,
                border: "1px solid #31294c",
                background: range === option ? "#31294c" : "#120f1e",
                color: "white",
                cursor: "pointer",
              }}
            >
              {getRangeLabel(option)}
            </button>
          ))}
        </div>

        {loading && <p>Loading leaderboard...</p>}
        {error && <p style={{ color: "#fca5a5" }}>{error}</p>}

        {!loading && rows.length > 0 && (
          <div style={{ display: "grid", gap: 12 }}>
            {rows.map((row, index) => {
              const topStyles = getTopRowStyles(index);

              return (
                <div
                  key={row.userId}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "80px minmax(220px,1.5fr) repeat(4,90px)",
                    alignItems: "center",
                    padding: "16px",
                    borderRadius: 16,
                    ...topStyles,
                  }}
                >
                  <div style={{ fontWeight: 800 }}>
                    {index === 0 ? "👑" : getRankDisplay(index)}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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

                    <div>
                      <div style={{ fontWeight: 700 }}>{row.userName}</div>
                      <div style={{ fontSize: 12 }}>{row.total} picks</div>
                    </div>
                  </div>

                  <div>{row.wins}-{row.losses}</div>
                  <div>{row.winPct}%</div>
                  <div>{row.pending}</div>
                  <div>{row.units >= 0 ? "+" : ""}{row.units}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}