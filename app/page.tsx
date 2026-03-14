"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Pick = {
  id: number;
  user_name: string;
  user_image: string | null;
  away_team: string;
  home_team: string;
  prop: string;
  american_odds: string;
  decimal_odds: string;
  bookie: string;
  created_at: string;
  pick_type?: string | null;
};

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatPickType(pickType?: string | null) {
  switch (pickType) {
    case "moneyline":
      return "Moneyline";
    case "spread":
      return "Spread";
    case "total":
      return "Total";
    case "player_prop":
      return "Player Prop";
    default:
      return "Pick";
  }
}

function getPickTypeBadge(pickType?: string | null) {
  switch (pickType) {
    case "moneyline":
      return {
        border: "1px solid rgba(129,140,248,0.30)",
        background: "rgba(99,102,241,0.14)",
        color: "#c7d2fe",
      };
    case "spread":
      return {
        border: "1px solid rgba(168,85,247,0.28)",
        background: "rgba(168,85,247,0.14)",
        color: "#e9d5ff",
      };
    case "total":
      return {
        border: "1px solid rgba(245,158,11,0.28)",
        background: "rgba(245,158,11,0.12)",
        color: "#fde68a",
      };
    case "player_prop":
      return {
        border: "1px solid rgba(34,197,94,0.24)",
        background: "rgba(34,197,94,0.12)",
        color: "#bbf7d0",
      };
    default:
      return {
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.05)",
        color: "#d4d4d8",
      };
  }
}

export default function HomePage() {
  const [recentPicks, setRecentPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRecentPicks() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/recent-picks", {
          cache: "no-store",
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load recent picks");
        }

        setRecentPicks(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || "Failed to load recent picks");
      } finally {
        setLoading(false);
      }
    }

    loadRecentPicks();
  }, []);

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
        <div style={{ marginBottom: 42 }}>
          <p
            style={{
              color: "#9f96c7",
              textTransform: "uppercase",
              letterSpacing: "2px",
              fontSize: "12px",
              marginBottom: "12px",
            }}
          >
            Welcome to Fore Zone
          </p>

          <h1 style={{ fontSize: "52px", marginTop: 0, marginBottom: 14 }}>
            Daily picks. Live board. Real competition.
          </h1>

          <p
            style={{
              color: "#c7c3da",
              fontSize: "18px",
              maxWidth: "760px",
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            Submit your best NBA pick of the day, track the board, and climb the
            leaderboard.
          </p>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Link
              href="/submit-pick"
              style={{
                textDecoration: "none",
                padding: "14px 18px",
                borderRadius: 14,
                background: "#6366f1",
                color: "white",
                fontWeight: 700,
                boxShadow: "0 0 16px rgba(99,102,241,0.20)",
                border: "1px solid rgba(129,140,248,0.22)",
              }}
            >
              Submit Pick
            </Link>

            <Link
              href="/nols"
              style={{
                textDecoration: "none",
                padding: "14px 18px",
                borderRadius: 14,
                background: "#110f1b",
                color: "white",
                border: "1px solid #31294c",
                fontWeight: 700,
              }}
            >
              View NoLs
            </Link>

            <Link
              href="/leaderboard"
              style={{
                textDecoration: "none",
                padding: "14px 18px",
                borderRadius: 14,
                background: "#110f1b",
                color: "#c7d2fe",
                border: "1px solid #31294c",
                fontWeight: 700,
              }}
            >
              Leaderboard
            </Link>
          </div>
        </div>

        <div
          style={{
            border: "1px solid #31294c",
            borderRadius: 22,
            background: "linear-gradient(180deg, #131021, #0b0914)",
            padding: 24,
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 18 }}>Latest Picks</h2>

          {loading && <p style={{ color: "#c7c3da" }}>Loading recent picks...</p>}
          {error && <p style={{ color: "#fca5a5" }}>{error}</p>}

          {!loading && !error && recentPicks.length === 0 && (
            <p style={{ color: "#c7c3da" }}>No picks yet.</p>
          )}

          {!loading && !error && recentPicks.length > 0 && (
            <div style={{ display: "grid", gap: 14 }}>
              {recentPicks.map((pick) => {
                const pickTypeBadge = getPickTypeBadge(pick.pick_type);

                return (
                  <div
                    key={pick.id}
                    style={{
                      border: "1px solid #31294c",
                      borderRadius: 16,
                      background: "#110f1b",
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 16,
                        alignItems: "center",
                        flexWrap: "wrap",
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {pick.user_image ? (
                          <Image
                            src={pick.user_image}
                            alt={pick.user_name}
                            width={36}
                            height={36}
                            unoptimized
                            style={{
                              borderRadius: "999px",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "999px",
                              background: "#1a1630",
                              border: "1px solid #31294c",
                            }}
                          />
                        )}

                        <div>
                          <div style={{ fontWeight: 700 }}>{pick.user_name}</div>
                          <div style={{ color: "#9f96c7", fontSize: 13 }}>
                            {pick.away_team} vs {pick.home_team}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            padding: "6px 10px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                            ...pickTypeBadge,
                          }}
                        >
                          {formatPickType(pick.pick_type)}
                        </span>

                        <div style={{ color: "#9f96c7", fontSize: 13 }}>
                          {formatTime(pick.created_at)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 6 }}>
                      <div>
                        <span style={{ color: "#9f96c7" }}>Pick: </span>
                        <span>{pick.prop}</span>
                      </div>
                      <div>
                        <span style={{ color: "#9f96c7" }}>Odds: </span>
                        <span>
                          {pick.american_odds} ({pick.decimal_odds})
                        </span>
                      </div>
                      <div>
                        <span style={{ color: "#9f96c7" }}>Bookie: </span>
                        <span>{pick.bookie}</span>
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