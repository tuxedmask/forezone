"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { getNBALogo } from "@/lib/nbaTeams";

type Pick = {
  id: number;
  user_id: string;
  user_name: string;
  user_image: string | null;
  game_id: string;
  away_team: string;
  home_team: string;
  commence_time: string;
  pick_type?: string | null;
  prop: string;
  american_odds: string;
  decimal_odds: string;
  bookie: string;
  created_at: string;
  result: "win" | "loss" | "pending" | null;
  settled_at: string | null;
};

const ADMIN_EMAIL = "sjohaadien82@gmail.com";

function formatGameTime(dateString: string) {
  return new Date(dateString).toLocaleString([], {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });
}

function formatSelectedDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);

  return localDate.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getTodayLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDate(dateString: string, amount: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);

  const nextYear = date.getFullYear();
  const nextMonth = `${date.getMonth() + 1}`.padStart(2, "0");
  const nextDay = `${date.getDate()}`.padStart(2, "0");

  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function TeamLogo({ team }: { team: string }) {
  const src = getNBALogo(team);

  if (!src) {
    return (
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: "#1a1630",
          border: "1px solid #31294c",
        }}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={team}
      width={34}
      height={34}
      unoptimized
      style={{ objectFit: "contain" }}
    />
  );
}

function resultColor(result: string | null | undefined) {
  if (result === "win") return "#4ade80";
  if (result === "loss") return "#fca5a5";
  return "#c7c3da";
}

function getResultCardStyle(result: string | null | undefined) {
  if (result === "win") {
    return {
      border: "1px solid rgba(74,222,128,0.26)",
      background: "linear-gradient(180deg, #131d17, #0b0f0d)",
      boxShadow: "0 0 18px rgba(74,222,128,0.08)",
    };
  }

  if (result === "loss") {
    return {
      border: "1px solid rgba(252,165,165,0.22)",
      background: "linear-gradient(180deg, #171113, #0b0910)",
      boxShadow: "0 0 16px rgba(252,165,165,0.06)",
    };
  }

  return {
    border: "1px solid #31294c",
    background: "#110f1b",
    boxShadow: "none",
  };
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

export default function AdminPage() {
  const { data: session, status } = useSession();

  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(getTodayLocalDateString());

  const formattedSelectedDate = useMemo(
    () => formatSelectedDate(selectedDate),
    [selectedDate]
  );

  async function loadPicks(date: string) {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/daily-picks?date=${date}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load picks");
      }

      setPicks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load picks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session?.user?.email === ADMIN_EMAIL) {
      loadPicks(selectedDate);
    }
  }, [session, selectedDate]);

  async function gradePick(
    pickId: number,
    result: "win" | "loss" | "pending"
  ) {
    try {
      setSavingId(pickId);

      const res = await fetch("/api/grade-pick", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pickId,
          result,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to grade pick");
      }

      setPicks((prev) =>
        prev.map((pick) =>
          pick.id === pickId
            ? {
                ...pick,
                result,
                settled_at:
                  result === "pending" ? null : new Date().toISOString(),
              }
            : pick
        )
      );
    } catch (err: any) {
      alert(err.message || "Failed to grade pick");
    } finally {
      setSavingId(null);
    }
  }

  if (status === "loading") {
    return (
      <main
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top, #1a1333 0%, #0d0a19 45%, #05030b 100%)",
          color: "white",
          padding: 40,
          fontFamily: "Arial, sans-serif",
        }}
      >
        Loading...
      </main>
    );
  }

  if (!session || session.user?.email !== ADMIN_EMAIL) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top, #1a1333 0%, #0d0a19 45%, #05030b 100%)",
          color: "white",
          padding: 40,
          fontFamily: "Arial, sans-serif",
        }}
      >
        Not authorized
      </main>
    );
  }

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
          Admin
        </p>

        <h1 style={{ fontSize: "44px", marginTop: 0, marginBottom: 12 }}>
          Grade Picks
        </h1>

        <p style={{ color: "#c7c3da", marginBottom: 24 }}>
          Update submitted picks as win, loss, or pending.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            marginBottom: 28,
            padding: 16,
            border: "1px solid #31294c",
            borderRadius: 18,
            background: "rgba(17, 15, 27, 0.9)",
          }}
        >
          <button
            onClick={() => setSelectedDate((prev) => shiftDate(prev, -1))}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #31294c",
              background: "#171327",
              color: "#e9e6f7",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ← Prev
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #31294c",
              background: "#0f0c1a",
              color: "#ffffff",
              fontSize: 14,
            }}
          />

          <button
            onClick={() => setSelectedDate((prev) => shiftDate(prev, 1))}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #31294c",
              background: "#171327",
              color: "#e9e6f7",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Next →
          </button>

          <button
            onClick={() => setSelectedDate(getTodayLocalDateString())}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(129,140,248,0.35)",
              background: "rgba(99,102,241,0.14)",
              color: "#c7d2fe",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Today
          </button>

          <div
            style={{
              color: "#c7c3da",
              fontSize: 14,
              marginLeft: "auto",
            }}
          >
            Viewing: <span style={{ color: "#fff", fontWeight: 700 }}>{formattedSelectedDate}</span>
          </div>
        </div>

        <div
          style={{
            border: "1px solid #31294c",
            borderRadius: 22,
            background: "linear-gradient(180deg, #131021, #0b0914)",
            padding: 20,
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          }}
        >
          {loading && <p style={{ color: "#c7c3da" }}>Loading picks...</p>}
          {error && <p style={{ color: "#fca5a5" }}>{error}</p>}

          {!loading && !error && picks.length === 0 && (
            <p style={{ color: "#c7c3da" }}>
              No picks submitted for {formattedSelectedDate}.
            </p>
          )}

          {!loading && !error && picks.length > 0 && (
            <div style={{ display: "grid", gap: 14 }}>
              {picks.map((pick) => {
                const pickTypeBadge = getPickTypeBadge(pick.pick_type);
                const cardStyle = getResultCardStyle(pick.result);

                return (
                  <div
                    key={pick.id}
                    style={{
                      border: cardStyle.border,
                      borderRadius: 18,
                      background: cardStyle.background,
                      boxShadow: cardStyle.boxShadow,
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
                        marginBottom: 14,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {pick.user_image ? (
                          <Image
                            src={pick.user_image}
                            alt={pick.user_name}
                            width={38}
                            height={38}
                            unoptimized
                            style={{
                              borderRadius: "999px",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: "999px",
                              background: "#1a1630",
                              border: "1px solid #31294c",
                            }}
                          />
                        )}

                        <div>
                          <div style={{ fontWeight: 700 }}>{pick.user_name}</div>
                          <div style={{ color: "#9f96c7", fontSize: 13 }}>
                            {formatGameTime(pick.commence_time)}
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

                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: "1px",
                            color: resultColor(pick.result),
                          }}
                        >
                          {(pick.result ?? "pending").toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        flexWrap: "wrap",
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <TeamLogo team={pick.away_team} />
                        <span style={{ fontWeight: 700 }}>{pick.away_team}</span>
                      </div>

                      <div style={{ color: "#8e86aa" }}>vs</div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <TeamLogo team={pick.home_team} />
                        <span style={{ fontWeight: 700 }}>{pick.home_team}</span>
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 6, marginBottom: 14 }}>
                      <div>
                        <span style={{ color: "#9f96c7" }}>Prop: </span>
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

                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        onClick={() => gradePick(pick.id, "win")}
                        disabled={savingId === pick.id}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 12,
                          border: "1px solid rgba(74,222,128,0.26)",
                          background: "rgba(74,222,128,0.10)",
                          color: "#4ade80",
                          fontWeight: 700,
                          cursor: savingId === pick.id ? "not-allowed" : "pointer",
                        }}
                      >
                        {savingId === pick.id ? "Saving..." : "Win"}
                      </button>

                      <button
                        onClick={() => gradePick(pick.id, "loss")}
                        disabled={savingId === pick.id}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 12,
                          border: "1px solid rgba(252,165,165,0.24)",
                          background: "rgba(252,165,165,0.08)",
                          color: "#fca5a5",
                          fontWeight: 700,
                          cursor: savingId === pick.id ? "not-allowed" : "pointer",
                        }}
                      >
                        {savingId === pick.id ? "Saving..." : "Loss"}
                      </button>

                      <button
                        onClick={() => gradePick(pick.id, "pending")}
                        disabled={savingId === pick.id}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 12,
                          border: "1px solid #31294c",
                          background: "#1a1630",
                          color: "#d6d3e6",
                          fontWeight: 700,
                          cursor: savingId === pick.id ? "not-allowed" : "pointer",
                        }}
                      >
                        {savingId === pick.id ? "Saving..." : "Pending"}
                      </button>
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