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

type RangeType = "daily" | "monthly" | "all";

function getRankDisplay(index: number) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `#${index + 1}`;
}

function getRangeLabel(range: RangeType) {
  if (range === "daily") return "Daily";
  if (range === "monthly") return "Monthly";
  return "All Time";
}

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentMonthString() {
  return new Date().toISOString().slice(0, 7);
}

function getTopRowStyles(index: number) {
  if (index === 0) {
    return {
      background:
        "linear-gradient(180deg, rgba(99,102,241,0.22), rgba(255,255,255,0.03))",
      border: "1px solid rgba(129,140,248,0.42)",
      boxShadow:
        "0 0 24px rgba(129,140,248,0.22), inset 0 0 24px rgba(99,102,241,0.06)",
    };
  }

  if (index === 1) {
    return {
      background:
        "linear-gradient(180deg, rgba(148,163,184,0.14), rgba(255,255,255,0.02))",
      border: "1px solid rgba(148,163,184,0.28)",
      boxShadow: "0 0 18px rgba(148,163,184,0.12)",
    };
  }

  if (index === 2) {
    return {
      background:
        "linear-gradient(180deg, rgba(180,83,9,0.16), rgba(255,255,255,0.02))",
      border: "1px solid rgba(217,119,6,0.30)",
      boxShadow: "0 0 18px rgba(217,119,6,0.14)",
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
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setLoading(true);
        setError("");

        let url = "/api/leaderboard?range=all";

        if (range === "daily") {
          url = `/api/leaderboard?range=daily&date=${selectedDate}`;
        } else if (range === "monthly") {
          url = `/api/leaderboard?range=monthly&month=${selectedMonth}`;
        }

        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load leaderboard");
        }

        setRows(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();
  }, [range, selectedDate, selectedMonth]);

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
        <p
          style={{
            color: "#9f96c7",
            textTransform: "uppercase",
            letterSpacing: "2px",
            fontSize: "12px",
            marginBottom: "12px",
          }}
        >
          Rankings
        </p>

        <h1 style={{ fontSize: "44px", marginTop: 0, marginBottom: 12 }}>
          Leaderboard
        </h1>

        <p style={{ color: "#c7c3da", marginBottom: 24 }}>
          {getRangeLabel(range)} rankings by units won.
        </p>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >
          {(["daily", "monthly", "all"] as RangeType[]).map((option) => {
            const active = range === option;

            return (
              <button
                key={option}
                type="button"
                onClick={() => setRange(option)}
                style={{
                  padding: "10px 16px",
                  borderRadius: 999,
                  border: active
                    ? "1px solid rgba(129,140,248,0.45)"
                    : "1px solid #31294c",
                  background: active ? "rgba(99,102,241,0.16)" : "#120f1e",
                  color: active ? "#c7d2fe" : "#ddd6fe",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "0.18s ease",
                  boxShadow: active
                    ? "0 0 16px rgba(99,102,241,0.18)"
                    : "none",
                }}
              >
                {getRangeLabel(option)}
              </button>
            );
          })}
        </div>

        {range === "daily" && (
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                color: "#b8b1d6",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #31294c",
                background: "#120f1e",
                color: "white",
                outline: "none",
              }}
            />
          </div>
        )}

        {range === "monthly" && (
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                color: "#b8b1d6",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              Select Month
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #31294c",
                background: "#120f1e",
                color: "white",
                outline: "none",
              }}
            />
          </div>
        )}

        <div
          style={{
            border: "1px solid #261f3f",
            borderRadius: 22,
            background: "linear-gradient(180deg, #131021, #0b0914)",
            padding: 20,
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          }}
        >
          {loading && <p style={{ color: "#b4b4c7" }}>Loading leaderboard...</p>}
          {error && <p style={{ color: "#fca5a5" }}>{error}</p>}

          {!loading && !error && rows.length === 0 && (
            <p style={{ color: "#b4b4c7" }}>No leaderboard data yet.</p>
          )}

          {!loading && !error && rows.length > 0 && (
            <div style={{ display: "grid", gap: 12 }}>
              {rows.map((row, index) => {
                const topStyles = getTopRowStyles(index);

                return (
                  <div
                    key={row.userId}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "80px minmax(220px, 1.5fr) repeat(4, minmax(90px, 0.75fr))",
                      gap: 12,
                      alignItems: "center",
                      padding: "16px 14px",
                      borderRadius: 16,
                      transition: "transform 0.18s ease, box-shadow 0.18s ease",
                      ...topStyles,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: index < 3 ? 24 : 20,
                          color: index === 0 ? "#c7d2fe" : "white",
                        }}
                      >
                        {getRankDisplay(index)}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {row.userImage ? (
                        <Image
                          src={row.userImage}
                          alt={row.userName}
                          width={44}
                          height={44}
                          unoptimized
                          style={{
                            borderRadius: "999px",
                            objectFit: "cover",
                            border:
                              index === 0
                                ? "1px solid rgba(129,140,248,0.35)"
                                : "1px solid rgba(255,255,255,0.08)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: "999px",
                            background: "#1a1630",
                            border: "1px solid #31294c",
                          }}
                        />
                      )}

                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 16,
                            color: index === 0 ? "#eef2ff" : "white",
                          }}
                        >
                          {row.userName}
                        </div>
                        <div style={{ color: "#9f96c7", fontSize: 12 }}>
                          {row.total} picks
                        </div>
                      </div>
                    </div>

                    <div>
                      <div style={{ color: "#9f96c7", fontSize: 12 }}>W-L</div>
                      <div style={{ fontWeight: 700 }}>
                        {row.wins}-{row.losses}
                      </div>
                    </div>

                    <div>
                      <div style={{ color: "#9f96c7", fontSize: 12 }}>Win %</div>
                      <div style={{ fontWeight: 700 }}>{row.winPct}%</div>
                    </div>

                    <div>
                      <div style={{ color: "#9f96c7", fontSize: 12 }}>Pending</div>
                      <div style={{ fontWeight: 700 }}>{row.pending}</div>
                    </div>

                    <div>
                      <div style={{ color: "#9f96c7", fontSize: 12 }}>Units</div>
                      <div
                        style={{
                          fontWeight: 800,
                          color: row.units >= 0 ? "#a5b4fc" : "#fca5a5",
                          textShadow:
                            row.units >= 0
                              ? "0 0 8px rgba(129,140,248,0.22)"
                              : "0 0 8px rgba(252,165,165,0.14)",
                        }}
                      >
                        {row.units >= 0 ? "+" : ""}
                        {row.units}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}